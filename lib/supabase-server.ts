import "server-only";
import { createClient } from "@supabase/supabase-js";
import { required } from "./env";

// For API routes / server components (anon key)
export function createServerClient() {
  return createClient(required.supabaseUrl(), required.supabaseAnonKey(), {
    auth: { persistSession: false },
  });
}

// For privileged tasks in API routes (DO NOT use in client code)
export function createAdminClient() {
  return createClient(required.supabaseUrl(), required.serviceRoleKey(), {
    auth: { persistSession: false },
  });
}
