import { createClient } from "@supabase/supabase-js";

export function getDatabase() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Database is not configured.");

  return createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
