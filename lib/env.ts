import "server-only";
/**
 * This file is server-only because it exposes server config (e.g., service role).
 * Do not import from Client Components.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // server-only
  transcribeEngine: process.env.TRANSCRIBE_ENGINE ?? "whisper-local",
  transcribeBaseUrl: process.env.TRANSCRIBE_BASE_URL ?? "http://127.0.0.1:8000",
};

function assertEnv<K extends keyof typeof env>(k: K) {
  const v = env[k];
  if (!v) throw new Error(`Missing env: ${String(k)}`);
  return v;
}

// Safe getters (throw on missing where required)
export const required = {
  supabaseUrl: () => assertEnv("supabaseUrl"),
  supabaseAnonKey: () => assertEnv("supabaseAnonKey"),
  serviceRoleKey: () => assertEnv("serviceRoleKey"),
  transcribeBaseUrl: () => assertEnv("transcribeBaseUrl"),
};
