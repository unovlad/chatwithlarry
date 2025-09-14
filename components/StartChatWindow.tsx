"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Send, Paperclip, Monitor, Globe } from "lucide-react";
import { toast } from "sonner";
import BlueGradientBackground from "./BlueGradientBackground";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGuestSession,
  incrementGuestMessageCount,
  getRemainingMessages as getGuestRemainingMessages,
} from "@/lib/guestStorage";

interface StartChatWindowProps {
  onStartChat: (initialMessage?: string) => Promise<void>;
}

const SUGGESTED_QUESTIONS = [
  "I'm nervous about turbulence",
  "Help me with breathing exercises",
  "What should I expect during takeoff?",
  "How can I stay calm during the flight?",
];

export function StartChatWindow({ onStartChat }: StartChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLimitRendered, setIsLimitRendered] = useState(false);
  const [guestSession, setGuestSession] = useState(getGuestSession());

  const { user, canSendMessage, incrementMessageCount } = useAuth();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleQuestionClick = async (question: string) => {
    // Перевіряємо ліміт повідомлень
    let canSend = false;
    if (user) {
      canSend = canSendMessage();
    } else {
      // Для гостьових користувачів перевіряємо localStorage
      const updatedGuestSession = getGuestSession();
      canSend = updatedGuestSession.canSendMessage;
      setGuestSession(updatedGuestSession);
    }

    if (isHydrated && !canSend) {
      setIsLimitRendered(true);
      toast.error(
        "You've reached the limit of 3 messages. Please sign up to continue.",
      );
      return;
    }

    try {
      if (user) {
        await incrementMessageCount();
      } else {
        incrementGuestMessageCount();
        setGuestSession(getGuestSession());
      }
      console.log("Starting chat with question:", question);
      onStartChat(question);
    } catch (error) {
      console.error("Error incrementing message count:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Перевіряємо ліміт повідомлень
      let canSend = false;
      if (user) {
        canSend = canSendMessage();
      } else {
        // Для гостьових користувачів перевіряємо localStorage
        const updatedGuestSession = getGuestSession();
        canSend = updatedGuestSession.canSendMessage;
        setGuestSession(updatedGuestSession);
      }

      if (isHydrated && !canSend) {
        setIsLimitRendered(true);
        toast.error(
          "You've reached the limit of 3 messages. Please sign up to continue.",
        );
        return;
      }

      try {
        if (user) {
          await incrementMessageCount();
        } else {
          incrementGuestMessageCount();
          setGuestSession(getGuestSession());
        }
        console.log("Starting chat with input:", inputValue.trim());
        onStartChat(inputValue.trim());
        setInputValue("");
      } catch (error) {
        console.error("Error incrementing message count:", error);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 ">
      <div className="h-full overflow-y-auto px-4 py-8 mt-4 sm:mt-20 md:pb-20">
        <div className="max-w-2xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <h1>Meet Larry</h1>
              <img className="w-8 h-8" src="/svg.svg" alt="Larry AI" />
            </div>
            <p className="text-base md:text-lg text-gray-600 mb-2">
              Your AI-powered flight anxiety support companion
            </p>
            <p className="text-sm text-gray-500 mb-6 px-2">
              Get personalized comfort, safety facts, and real-time assistance
              whenever you need it most. Larry is here to help you conquer your
              fear of flying.
            </p>
          </div>
          <BlueGradientBackground />
          {/* Input Field with controls */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Larry about your flight concerns..."
                  className="w-full px-4 py-3 md:py-4 pr-12 md:pr-16 text-base md:text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background shadow-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-900 hover:bg-gray-800 rounded-full w-7 h-7 md:w-8 md:h-8 p-0"
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-3 h-3 md:w-4 md:h-4" />
                </Button>
              </div>
            </form>

            {/* Input controls */}
          </div>
          {/* Suggested Questions - Always visible */}
          <div className="space-y-4">
            <div className="space-y-3">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="default"
                  className="w-full justify-between p-3 md:p-3 h-auto text-left transition-colors bg-white! border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300"
                  onClick={() => handleQuestionClick(question)}
                >
                  <span className="text-sm md:text-base text-gray-700">
                    {question}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </Button>
              ))}
            </div>
          </div>

          {/* Limit message - show if reached and user tried to send */}
          {isHydrated && !canSendMessage() && isLimitRendered && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700 text-center">
                You&apos;ve reached the limit of 3 messages. Sign up to continue
                chatting with Larry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
