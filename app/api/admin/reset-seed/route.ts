import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { seedDatabase } from '@/lib/seed';
import { verifyAdminPassword } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const isAuthed = await verifyAdminPassword(request);
  if (!isAuthed) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();

  const { data: matchIds, error: matchFetchError } = await supabase.from('matches').select('id');
  if (matchFetchError) {
    throw matchFetchError;
  }

  if ((matchIds || []).length > 0) {
    const { error: matchDeleteError } = await supabase.from('matches').delete().in(
      'id',
      (matchIds || []).map((row) => row.id)
    );
    if (matchDeleteError) {
      throw matchDeleteError;
    }
  }

  const { data: teamIds, error: teamFetchError } = await supabase.from('teams').select('id');
  if (teamFetchError) {
    throw teamFetchError;
  }

  if ((teamIds || []).length > 0) {
    const { error: teamDeleteError } = await supabase.from('teams').delete().in(
      'id',
      (teamIds || []).map((row) => row.id)
    );
    if (teamDeleteError) {
      throw teamDeleteError;
    }
  }

  const result = await seedDatabase();
  return NextResponse.json({ reset: true, ...result });
}
