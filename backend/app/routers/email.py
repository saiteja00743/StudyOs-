import os
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from supabase import create_client
from app.services.email_service import send_bulk_email

router = APIRouter(prefix="/api/admin", tags=["Admin Email"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def verify_admin(authorization: str | None) -> str:
    """Verify the caller has role='admin' in Supabase profiles."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    token = authorization.split(" ", 1)[1]
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(status_code=500, detail="Server not configured.")
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    # Verify JWT and get user
    user = client.auth.get_user(token)
    if not user or not user.user:
        raise HTTPException(status_code=401, detail="Invalid token.")
    uid = user.user.id
    # Check role in profiles
    result = client.table("profiles").select("role").eq("id", uid).single().execute()
    if not result.data or result.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return uid


# ─── Schema ───────────────────────────────────────────────────────────────────
class EmailCampaignRequest(BaseModel):
    subject: str
    message: str          # Plain text from the composer
    badge: str = "📢 Announcement"
    cta_text: str = "Open StudyOS"
    cta_url: str = "https://studyos.dpdns.org/dashboard"
    tag: str = "announcement"


# ─── HTML email builder ────────────────────────────────────────────────────────
def build_html(subject: str, message: str, badge: str, cta_text: str, cta_url: str) -> str:
    message_html = message.replace("\n", "<br>")
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a24,#12121a);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border:1px solid rgba(255,255,255,0.06);border-bottom:none;">
            <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:16px;">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#da7756,#e0966d);display:inline-block;line-height:36px;text-align:center;font-size:18px;">🧠</div>
              <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Study<span style="color:#da7756;">OS</span> AI</span>
            </div>
            <div style="display:inline-block;background:rgba(218,119,86,0.15);border:1px solid rgba(218,119,86,0.3);border-radius:100px;padding:6px 16px;font-size:12px;font-weight:600;color:#da7756;margin-bottom:0;">
              {badge}
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#13131a;padding:36px 40px;border:1px solid rgba(255,255,255,0.06);border-top:none;border-bottom:none;">
            <h1 style="margin:0 0 20px;font-size:24px;font-weight:800;color:#f5f0eb;letter-spacing:-0.5px;line-height:1.3;">{subject}</h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#a8a299;">{message_html}</p>
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
              <a href="{cta_url}"
                 style="display:inline-block;background:linear-gradient(135deg,#da7756,#e0966d);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:-0.2px;">
                {cta_text} →
              </a>
            </td></tr></table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d0d14;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(255,255,255,0.06);border-top:none;">
            <p style="margin:0 0 8px;font-size:12px;color:#4a4a5a;">You're receiving this because you have a StudyOS AI account.</p>
            <p style="margin:0;font-size:12px;color:#333344;">© 2026 StudyOS AI · <a href="https://studyos.dpdns.org" style="color:#da7756;text-decoration:none;">studyos.dpdns.org</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ─── Route ────────────────────────────────────────────────────────────────────
@router.post("/send-email")
async def send_email_campaign(
    payload: EmailCampaignRequest,
    authorization: str | None = Header(default=None),
):
    """Send a bulk email campaign to all StudyOS users. Admin-only."""
    verify_admin(authorization)

    html = build_html(
        subject=payload.subject,
        message=payload.message,
        badge=payload.badge,
        cta_text=payload.cta_text,
        cta_url=payload.cta_url,
    )

    result = send_bulk_email(
        subject=payload.subject,
        html_body=html,
        tag=payload.tag,
    )

    return {
        "success": True,
        "sent": result["sent"],
        "failed": result["failed"],
        "total": result["sent"] + result["failed"],
        "recipients": result["recipients"],
    }


@router.get("/email-preview")
async def preview_email(
    subject: str = "🎉 Special Offer for You!",
    message: str = "This is a preview of your email campaign.",
    badge: str = "📢 Announcement",
    authorization: str | None = Header(default=None),
):
    """Return an HTML preview of the email. Admin-only."""
    verify_admin(authorization)
    html = build_html(subject=subject, message=message, badge=badge,
                      cta_text="Open StudyOS", cta_url="https://studyos.dpdns.org/dashboard")
    return {"html": html}
