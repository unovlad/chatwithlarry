"use client";

import { StartChatWindow } from "@/components/StartChatWindow";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";

interface HomePageClientProps {
  randomQuestions: string[];
}

export function HomePageClient({ randomQuestions }: HomePageClientProps) {
  const router = useRouter();

  const handleStartChat = async (message?: string) => {
    try {
      console.log("HomePageClient: Starting chat with message:", message);

      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initialMessage: message,
        }),
      });

      console.log("HomePageClient: Response status:", response.status);
      console.log("HomePageClient: Response ok:", response.ok);

      if (response.ok) {
        const { chatId } = await response.json();
        console.log(
          "HomePageClient: Chat created successfully, redirecting to:",
          chatId,
        );

        console.log("HomePageClient: About to redirect to:", `/chat/${chatId}`);
        router.push(`/chat/${chatId}`);
        console.log("HomePageClient: router.push called");
      } else {
        const errorData = await response.json();
        console.error("HomePageClient: Failed to create chat:", errorData);
        throw new Error(errorData.error || "Failed to create chat");
      }
    } catch (error) {
      console.error("HomePageClient: Error creating chat:", error);
      throw error; // Re-throw to be handled by StartChatWindow
    }
  };

  return (
    <>
      <StartChatWindow
        onStartChat={handleStartChat}
        randomQuestions={randomQuestions}
      />

      <Footer />
    </>
  );
}
