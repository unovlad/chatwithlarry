"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Send } from "lucide-react";
import { toast } from "sonner";
import BlueGradientBackground from "./BlueGradientBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  getGuestSession,
  getRemainingMessages as getGuestRemainingMessages,
} from "@/lib/guestStorage";
import Image from "next/image";

interface StartChatWindowProps {
  onStartChat: (initialMessage?: string) => Promise<void>;
  randomQuestions: string[];
}

export function StartChatWindow({
  onStartChat,
  randomQuestions,
}: StartChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLimitRendered, setIsLimitRendered] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const { user, canSendMessage, incrementMessageCount } = useAuth();
  const router = useRouter();

  // Отримуємо кількість залишкових повідомлень для гостей
  const guestRemainingMessages =
    isHydrated && !user ? getGuestRemainingMessages() : 0;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleQuestionClick = async (question: string) => {
    if (!user) {
      // Перевіряємо ліміт повідомлень для гостей перед перенаправленням
      const guestSession = getGuestSession();
      if (!guestSession.canSendMessage) {
        toast.error(
          "You've reached the limit of messages. Please sign up to continue.",
        );
        return;
      }

      // Неавторизований користувач - перенаправляємо на /fast з початковим повідомленням
      router.push(`/fast?message=${encodeURIComponent(question)}`);
      return;
    }

    const canSend = canSendMessage();

    if (isHydrated && !canSend) {
      setIsLimitRendered(true);
      toast.error(
        "You've reached the limit of 3 messages. Please sign up to continue.",
      );
      return;
    }

    try {
      console.log("StartChatWindow: Starting chat creation process...");
      setIsCreatingChat(true);
      console.log("StartChatWindow: isCreatingChat set to true");

      console.log("StartChatWindow: Starting chat with question:", question);
      await onStartChat(question);
      console.log("StartChatWindow: onStartChat completed successfully");
    } catch (error) {
      console.error("StartChatWindow: Error creating chat:", error);
      toast.error("Failed to create chat. Please try again.");
    } finally {
      console.log("StartChatWindow: Setting isCreatingChat to false");
      setIsCreatingChat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      if (!user) {
        // Перевіряємо ліміт повідомлень для гостей перед перенаправленням
        const guestSession = getGuestSession();
        if (!guestSession.canSendMessage) {
          toast.error(
            "You've reached the limit of messages. Please sign up to continue.",
          );
          return;
        }

        // Неавторизований користувач - перенаправляємо на /fast з початковим повідомленням
        router.push(`/fast?message=${encodeURIComponent(inputValue.trim())}`);
        setInputValue("");
        return;
      }

      const canSend = canSendMessage();

      if (isHydrated && !canSend) {
        setIsLimitRendered(true);
        toast.error(
          "You've reached the limit of 3 messages. Please sign up to continue.",
        );
        return;
      }

      try {
        console.log(
          "StartChatWindow: Starting chat creation process (submit)...",
        );
        setIsCreatingChat(true);
        console.log("StartChatWindow: isCreatingChat set to true (submit)");

        console.log(
          "StartChatWindow: Starting chat with input:",
          inputValue.trim(),
        );
        await onStartChat(inputValue.trim());
        console.log(
          "StartChatWindow: onStartChat completed successfully (submit)",
        );
        setInputValue("");
      } catch (error) {
        console.error("StartChatWindow: Error creating chat (submit):", error);
        toast.error("Failed to create chat. Please try again.");
      } finally {
        console.log(
          "StartChatWindow: Setting isCreatingChat to false (submit)",
        );
        setIsCreatingChat(false);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 ">
      <BlueGradientBackground />
      <div className="h-full overflow-y-auto px-4 py-8 mt-4 sm:mt-20 md:pb-20">
        <div className="max-w-2xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <h1>Meet Larry</h1>
              <Image
                className="w-8 h-8"
                src="/svg.svg"
                alt="Larry AI"
                width={32}
                height={32}
              />
            </div>
            <p className="text-base md:text-lg text-gray-600 mb-2">
              Your flight anxiety support companion
            </p>
            <p className="text-sm text-gray-500 mb-6 px-2 hidden sm:block">
              Get personalized comfort, safety facts, and real-time assistance
              whenever you need it most. Larry is here to help you conquer your
              fear of flying.
            </p>
          </div>

          {/* Input Field with controls */}
          <div className="space-y-4 z-30">
            <form onSubmit={handleSubmit} className="w-full ">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Larry about your flight concerns..."
                  disabled={isCreatingChat}
                  className="w-full px-4 py-3 md:py-4 pr-12 md:pr-16 text-base md:text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-900 hover:bg-gray-800 rounded-full w-7 h-7 md:w-8 md:h-8 p-0"
                  disabled={!inputValue.trim() || isCreatingChat}
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
              {randomQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="default"
                  className="w-full justify-between p-3 md:p-3 h-auto text-left transition-colors bg-white! border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleQuestionClick(question)}
                  disabled={isCreatingChat}
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
                You&apos;ve reached the limit of 3 messages. Sign up to
                continue.
              </p>
            </div>
          )}

          {/* Guest limit message */}
          {isHydrated && !user && guestRemainingMessages === 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700 text-center">
                You&apos;ve reached the limit of guest messages. Sign up to
                continue.
              </p>
            </div>
          )}

          {/* Creating chat indicator for authenticated users */}
          {isCreatingChat && user && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                Creating your chat...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
