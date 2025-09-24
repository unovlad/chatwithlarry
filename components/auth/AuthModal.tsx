"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Close modal when user is authenticated and not loading
  useEffect(() => {
    if (user && !loading && isOpen) {
      onClose();
      router.push("/");
    }
  }, [user, loading, isOpen, onClose, router]);

  const handleSuccess = () => {
    // Don't close immediately - let the useEffect handle it when user state updates
  };

  const switchToSignUp = () => {
    setMode("signup");
  };

  const switchToSignIn = () => {
    setMode("signin");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "signin" ? "Welcome back" : "Create Account"}
            </h2>
          </div>

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
