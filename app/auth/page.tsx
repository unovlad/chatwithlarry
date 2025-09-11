"use client";

import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Визначаємо режим на основі URL параметрів
    const urlMode = searchParams.get("mode");
    if (urlMode === "signin") {
      setMode("signin");
    } else {
      setMode("signup");
    }
  }, [searchParams]);

  useEffect(() => {
    // Якщо користувач вже авторизований, перенаправляємо на головну
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSuccess = () => {
    router.push("/");
  };

  const switchToSignUp = () => {
    setMode("signup");
  };

  const switchToSignIn = () => {
    setMode("signin");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Larry AI
          </h1>
          <p className="text-gray-600">Your flight anxiety support companion</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          {mode === "signin" ? (
            <SignInForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={switchToSignUp}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToSignIn={switchToSignIn}
            />
          )}
        </div>
      </div>
    </div>
  );
}
