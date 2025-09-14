"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LoaderCircle } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          router.push("/auth?error=auth_failed");
          return;
        }

        if (data.session) {
          // Успішна авторизація, перенаправляємо на головну сторінку
          router.push("/");
        } else {
          // Немає сесії, перенаправляємо на сторінку авторизації
          router.push("/auth");
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        router.push("/auth?error=unexpected_error");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoaderCircle className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
