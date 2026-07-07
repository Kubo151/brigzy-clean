import { createClient } from '@supabase/supabase-js';

// Strip BOM / zero-width / stray whitespace — env values pasted into dashboards
// (e.g. Vercel) can carry invisible characters that make browser fetch reject
// the Authorization/apikey headers ("non ISO-8859-1 code point").
const cleanEnv = (v: string | undefined) => v?.replace(/[\u{FEFF}\u{200B}-\u{200D}\s]/gu, '');

const supabaseUrl = cleanEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
