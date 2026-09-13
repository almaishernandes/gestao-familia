import { createClient } from "@supabase/supabase-js";

// Tipagem forte (Database) fica pendente até rodar:
// npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
// Enquanto isso, o client roda sem generics para não travar o build com tipos placeholder.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
