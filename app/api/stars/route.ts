import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// Public endpoint: record/remove a device's "star" for a team. No admin auth —
// starring is a public action — but it is NOT loop-exploitable: stars are stored
// one row per (device, team) with a unique key, so repeating "follow" is a no-op
// and can't inflate the count. teams.star_count is maintained by a DB trigger.
export async function POST(request: Request) {
  let body: { teamId?: string; deviceId?: string; follow?: boolean };
  try {
    body = (await request.json()) as { teamId?: string; deviceId?: string; follow?: boolean };
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const { teamId, deviceId, follow } = body;

  // Validate at the boundary. deviceId bounds mirror the DB CHECK constraint.
  if (!teamId || typeof teamId !== 'string') {
    return NextResponse.json({ ok: false, message: 'teamId is required.' }, { status: 400 });
  }
  if (!deviceId || typeof deviceId !== 'string' || deviceId.length < 8 || deviceId.length > 64) {
    return NextResponse.json({ ok: false, message: 'A valid deviceId is required.' }, { status: 400 });
  }
  if (typeof follow !== 'boolean') {
    return NextResponse.json({ ok: false, message: 'follow (boolean) is required.' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServerClient();

    if (follow) {
      // Insert the star; a duplicate (already starred from this device) is a
      // harmless no-op, so 23505 is swallowed. The AFTER INSERT trigger only
      // fires — and only bumps the count — when a row is actually added.
      const { error } = await supabase.from('team_stars').insert({ device_id: deviceId, team_id: teamId });
      if (error && error.code !== '23505') {
        console.error('Star add error:', error);
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
      }
    } else {
      // Remove this device's star (no-op if it wasn't starred); trigger decrements.
      const { error } = await supabase.from('team_stars').delete().eq('device_id', deviceId).eq('team_id', teamId);
      if (error) {
        console.error('Star remove error:', error);
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected star API error:', err);
    return NextResponse.json({ ok: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
