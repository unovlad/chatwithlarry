import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Supabase URL:", supabaseUrl ? "Present" : "Missing");
  console.log("Supabase Key:", supabaseAnonKey ? "Present" : "Missing");
  console.log("Full URL:", supabaseUrl);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file.",
    );
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  console.log("Supabase client created successfully");
  return supabaseClient;
}
