import { NextResponse } from 'next/server';
import { isAdminPassword } from '@/lib/admin-auth';
import { checkRateLimit, clientKey, registerFailure, registerSuccess } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const key = clientKey(request);

  const limit = checkRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const { password } = await request.json();

    if (isAdminPassword(password)) {
      registerSuccess(key);
      return NextResponse.json({ ok: true });
    }

    registerFailure(key);
    return NextResponse.json({ ok: false, message: 'Incorrect password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 });
  }
}
