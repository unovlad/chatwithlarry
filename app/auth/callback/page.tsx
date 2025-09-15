"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { LoaderCircle } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus("Processing OAuth callback...");
        console.log("Auth callback page loaded");

        // Перевіряємо URL параметри
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
          console.error("OAuth error from URL:", error);
          setStatus("OAuth error occurred");
          setTimeout(() => {
            router.push("/auth?error=oauth_error");
          }, 1000);
          return;
        }

        if (code) {
          console.log("OAuth code received:", code);
          setStatus("Authentication successful!");

          // Даємо час AuthContext обробити зміни
          setTimeout(() => {
            console.log("Redirecting to home page...");
            router.push("/");
          }, 1500);
        } else {
          console.log("No OAuth code found, redirecting to auth");
          setStatus("No OAuth code found");
          setTimeout(() => {
            router.push("/auth");
          }, 1000);
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        setStatus("Unexpected error");
        setTimeout(() => {
          router.push("/auth?error=unexpected_error");
        }, 1000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <LoaderCircle className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">{status}</p>
        <p className="text-sm text-gray-400 mt-2">
          Please wait while we complete your sign in...
        </p>
      </div>
    </div>
  );
}
