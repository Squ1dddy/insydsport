import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';
import { verifyAdminPassword } from '@/lib/admin-auth';

// Seeding is an admin-only action. The public site no longer auto-seeds; an empty
// database is populated via the admin panel (this route or reset-seed), both gated
// by the admin password so a random visitor can't trigger writes.
export async function POST(request: Request) {
  const isAuthed = await verifyAdminPassword(request);
  if (!isAuthed) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
