import { createClient } from "@supabase/supabase-js";
import type { Database } from "@kniferoll/types";
import { safeGetItem, safeSetItem } from "./storage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `Missing Supabase environment variables:\n` +
      `VITE_SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ missing"}\n` +
      `VITE_SUPABASE_PUBLISHABLE_KEY: ${supabaseKey ? "✓" : "✗ missing"}\n` +
      `Make sure .env.local exists in the project root and restart the dev server.`
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export function getDeviceToken(): string {
  let token = safeGetItem("kniferoll_device_token");
  if (!token) {
    token = crypto.randomUUID();
    safeSetItem("kniferoll_device_token", token);
  }
  return token;
}
