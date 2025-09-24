import { Suspense } from "react";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import UpgradeClient from "./UpgradeClient";
import { Footer } from "@/components/Footer";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <UpgradeClient success={params.success} />
          <Footer fixed={true} />
        </Suspense>
      </div>
    </div>
  );
}
