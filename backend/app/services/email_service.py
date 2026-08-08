import os
import resend
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "StudyOS AI <noreply@studyos.dpdns.org>")


def get_all_user_emails() -> list[dict]:
    """Fetch all user emails + names using the Supabase service role (bypasses RLS)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Supabase service role credentials not configured.")
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    # auth.admin.list_users() returns all auth users (requires service role)
    response = client.auth.admin.list_users()
    users = []
    for user in response:
        if user.email:
            name = (
                (user.user_metadata or {}).get("full_name")
                or user.email.split("@")[0]
            )
            users.append({"email": user.email, "name": name})
    return users


def send_bulk_email(
    subject: str,
    html_body: str,
    tag: str = "announcement",
) -> dict:
    """Send an email to every registered StudyOS user via Resend."""
    if not resend.api_key:
        raise ValueError("RESEND_API_KEY not configured.")

    users = get_all_user_emails()
    if not users:
        return {"sent": 0, "failed": 0, "recipients": []}

    sent = 0
    failed = 0
    recipients = []

    for user in users:
        try:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": [user["email"]],
                "subject": subject,
                "html": html_body,
                "tags": [{"name": "campaign", "value": tag}],
            })
            sent += 1
            recipients.append({"email": user["email"], "status": "sent"})
        except Exception as e:
            failed += 1
            recipients.append({"email": user["email"], "status": "failed", "error": str(e)})

    return {"sent": sent, "failed": failed, "recipients": recipients}
