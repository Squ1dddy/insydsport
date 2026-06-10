// Admin password is read from the ADMIN_PASSWORD environment variable.
// It is intentionally NOT hardcoded so it never lives in the repo / git history.
// Fail-closed: if ADMIN_PASSWORD is not configured on the server, all admin
// access is denied (set it in Netlify env vars and in .env.local for local dev).

export function isAdminPassword(password: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return false;
  }
  return password === expected;
}

export function verifyAdminPassword(request: Request) {
  return isAdminPassword(request.headers.get('x-admin-password'));
}
