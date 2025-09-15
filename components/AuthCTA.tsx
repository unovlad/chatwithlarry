"use client";

import { Button } from "./ui/button";
import { Lock, MessageCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AuthCTAProps {
  remainingMessages?: number;
  context?: "limit" | "access" | "continue";
}

export function AuthCTA({
  remainingMessages = 0,
  context = "limit",
}: AuthCTAProps) {
  const { openAuthModal } = useAuth();
  const router = useRouter();

  const getContent = () => {
    switch (context) {
      case "access":
        return {
          title: "Sign In Required",
          description:
            "This chat belongs to another user. Please sign in to access your own chats or start a new conversation.",
          buttonText: "Sign In",
          defaultMode: "signin" as const,
        };
      case "continue":
        return {
          title: "Continue Chatting",
          description: `You have ${remainingMessages} guest message${remainingMessages === 1 ? "" : "s"} left. Sign up to get unlimited messages and save your chat history.`,
          buttonText: "Sign Up for Free",
          defaultMode: "signup" as const,
        };
      case "limit":
      default:
        return {
          title: "Limit Reached",
          description:
            "You've used all 3 guest messages. Sign up to continue chatting with Larry!",
          buttonText: "Sign Up for Free",
          defaultMode: "signup" as const,
        };
    }
  };

  const content = getContent();

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
              {content.title}
            </h3>
            <p className="text-sm text-gray-600">{content.description}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => openAuthModal(content.defaultMode)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {content.buttonText}
            </Button>

            {context === "access" && (
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Start New Chat
              </Button>
            )}

            <div className="text-xs text-gray-500">
              Extended messages • Save chat history • Flight tracking
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
