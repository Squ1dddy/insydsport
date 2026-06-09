import { createClient } from '@supabase/supabase-js';

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, anonKey, serviceKey };
}

export function getSupabaseBrowserClient() {
  const { url, anonKey } = getConfig();
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey);
}

export function createSupabaseServerClient() {
  const { url, anonKey, serviceKey } = getConfig();
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables.');
  }
  return createClient(url, serviceKey || anonKey);
}

export function getSupabaseServerReadOnlyClient() {
  const { url, anonKey } = getConfig();
  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables.');
  }
  return createClient(url, anonKey);
}
