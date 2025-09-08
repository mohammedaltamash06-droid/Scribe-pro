"use client";
import { createClient } from "@supabase/supabase-js";
import { required } from "./env";

export const supabase = createClient(
  required.supabaseUrl(),
  required.supabaseAnonKey(),
  { auth: { persistSession: true, autoRefreshToken: true } }
);
