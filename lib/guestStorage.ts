"use client";

const GUEST_MESSAGES_KEY = "larry_guest_messages";
const GUEST_CHAT_ID_KEY = "larry_guest_chat_id";
const GUEST_MESSAGE_LIMIT = 3;

export interface GuestSession {
  chatId: string | null;
  messageCount: number;
  canSendMessage: boolean;
}

export function getGuestSession(): GuestSession {
  if (typeof window === "undefined") {
    return {
      chatId: null,
      messageCount: 0,
      canSendMessage: false,
    };
  }

  const messageCount = parseInt(
    localStorage.getItem(GUEST_MESSAGES_KEY) || "0",
  );
  const chatId = localStorage.getItem(GUEST_CHAT_ID_KEY);

  return {
    chatId,
    messageCount,
    canSendMessage: messageCount < GUEST_MESSAGE_LIMIT,
  };
}

export function incrementGuestMessageCount(): boolean {
  if (typeof window === "undefined") return false;

  const currentCount = parseInt(
    localStorage.getItem(GUEST_MESSAGES_KEY) || "0",
  );
  const newCount = currentCount + 1;

  if (newCount > GUEST_MESSAGE_LIMIT) {
    return false; // Ліміт перевищено
  }

  localStorage.setItem(GUEST_MESSAGES_KEY, newCount.toString());
  return true;
}

export function setGuestChatId(chatId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CHAT_ID_KEY, chatId);
}

export function clearGuestSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_MESSAGES_KEY);
  localStorage.removeItem(GUEST_CHAT_ID_KEY);
}

export function getRemainingMessages(): number {
  if (typeof window === "undefined") return 0;

  const messageCount = parseInt(
    localStorage.getItem(GUEST_MESSAGES_KEY) || "0",
  );
  return Math.max(0, GUEST_MESSAGE_LIMIT - messageCount);
}

export function isGuestSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GUEST_CHAT_ID_KEY) !== null;
}



