import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let client: SupabaseClient | null = null;

export function getSupabase(config: SupabaseConfig): SupabaseClient {
  if (client) return client;
  client = createClient(config.url, config.anonKey, {
    auth: { persistSession: false },
  });
  return client;
}

/** Resolve config from env on either platform. */
export function configFromEnv(): SupabaseConfig | null {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
