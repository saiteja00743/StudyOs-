/**
 * userScope.ts
 * ─────────────────────────────────────────────────────────────
 * Generates user-scoped localStorage keys so that data from
 * one user never bleeds into another user's session on the
 * same browser.
 *
 * Usage:
 *   import { scopedKey, clearUserData } from '@/services/userScope';
 *   const key = scopedKey('studyos_notes');   // "studyos_notes__usr-xyz"
 */

/** Get current logged-in user ID from Supabase session in localStorage */
export function getCurrentUserId(): string | null {
  try {
    // Supabase v2 stores the session under a key like "sb-<project-ref>-auth-token"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const uid = parsed?.user?.id;
          if (uid) return uid;
        }
      }
    }

    // Fallback: check legacy local session key
    const local = localStorage.getItem('studyos_current_active_user');
    if (local) {
      const parsed = JSON.parse(local);
      return parsed?.user?.id || null;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

/** Returns a user-scoped storage key.
 *  If no user is logged in, falls back to the base key (shouldn't happen in a protected app). */
export function scopedKey(baseKey: string): string {
  const uid = getCurrentUserId();
  // Use first 8 chars of UID for brevity while still being unique
  return uid ? `${baseKey}__${uid.substring(0, 8)}` : baseKey;
}

/** Clear all scoped localStorage data for a specific user */
export function clearUserData(userId: string) {
  const prefix = userId.substring(0, 8);
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.endsWith(`__${prefix}`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
