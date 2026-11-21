// Supabase renamed the "anon" key to a "publishable" key. Accept either name.
// Each must be read as a literal process.env.NEXT_PUBLIC_* so Next can inline it.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
