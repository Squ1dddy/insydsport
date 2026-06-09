export function verifyAdminPassword(request: Request) {
  const password = request.headers.get('x-admin-password');
  return password === '***REMOVED***';
}
