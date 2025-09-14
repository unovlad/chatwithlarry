"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Lock, MessageCircle } from "lucide-react";
import { AuthModal } from "./auth/AuthModal";

interface AuthCTAProps {
  remainingMessages?: number;
}

export function AuthCTA({ remainingMessages = 0 }: AuthCTAProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {remainingMessages === 0 ? "Limit Reached" : "Continue Chatting"}
            </h3>
            <p className="text-sm text-gray-600">
              {remainingMessages === 0
                ? "You've used all 3 guest messages. Sign up to continue chatting with Larry!"
                : `You have ${remainingMessages} guest message${remainingMessages === 1 ? "" : "s"} left. Sign up to get unlimited messages and save your chat history.`}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sign Up for Free
            </Button>

            <div className="text-xs text-gray-500">
              Extended messages • Save chat history • Flight tracking
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signup"
      />
    </>
  );
}
