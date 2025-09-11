"use client";

import { useRouter } from "next/navigation";
import { StartChatWindow } from "@/components/StartChatWindow";
import { nanoid } from "nanoid";

export function HomePageClient() {
  const router = useRouter();

  const handleStartChat = (message?: string) => {
    // Генеруємо унікальний ID сесії в клієнтському компоненті
    const sessionId = nanoid();

    // Зберігаємо початкове повідомлення в localStorage для цієї сесії
    if (message) {
      localStorage.setItem(`larry-initial-message-${sessionId}`, message);
    }

    // Переходимо на сторінку чату з ID сесії
    router.push(`/chat/${sessionId}`);
  };

  return <StartChatWindow onStartChat={handleStartChat} />;
}
