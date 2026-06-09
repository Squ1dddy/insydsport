import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = '***REMOVED***';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true });
    }
    
    return NextResponse.json({ ok: false, message: 'Incorrect password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 });
  }
}
