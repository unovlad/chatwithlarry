"use client";

import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";

function AuthContent() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Determine mode based on URL parameters
    const urlMode = searchParams.get("mode");
    if (urlMode === "signin") {
      setMode("signin");
    } else {
      setMode("signup");
    }
  }, [searchParams]);

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSuccess = () => {
    // Don't redirect immediately - let the useEffect handle it when user state updates
  };

  const switchToSignUp = () => {
    setMode("signup");
  };

  const switchToSignIn = () => {
    setMode("signin");
  };

  return (
    <div className="h-full mt-10 sm:mt-20 flex items-center justify-center px-4 flex-col flex w-full">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Larry AI
          </h1>
        </div>

        <div className=" rounded-lg shadow-xl p-6">
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

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Larry AI
              </h1>
              <p className="text-gray-600">
                Your flight anxiety support companion
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-xl p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AuthContent />
      <Footer fixed={true} />
    </Suspense>
  );
}
