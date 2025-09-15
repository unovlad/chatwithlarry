import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  // Отримуємо профіль користувача
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    redirect("/auth");
  }

  return <PlansClient user={profile} />;
}
