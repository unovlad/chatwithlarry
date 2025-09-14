"use client";

import { StartChatWindow } from "@/components/StartChatWindow";
import { Footer } from "@/components/Footer";
import { createChatAction } from "@/lib/chatActions";

export function HomePageClient() {
  const handleStartChat = async (message?: string) => {
    try {
      console.log("HomePageClient: Starting chat with message:", message);
      await createChatAction(message);
    } catch (error) {
      console.error("Error creating chat:", error);
      // Тут можна додати toast notification про помилку
    }
  };

  return (
    <>
      <StartChatWindow onStartChat={handleStartChat} />
      <Footer />
    </>
  );
}
