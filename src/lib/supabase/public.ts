import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";

// Session-less anon client: sees only what RLS shows the public, even when an admin or owner is logged in.
export function createPublicClient() {
  return createClient(supabaseUrl!, supabaseKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
