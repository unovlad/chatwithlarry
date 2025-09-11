// Утиліти для роботи з localStorage лімітами

const MESSAGE_COUNT_KEY = "larry_messages";
const MESSAGE_LIMIT = 3;

export function getAnonymousMessageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const count = localStorage.getItem(MESSAGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementAnonymousMessageCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const current = getAnonymousMessageCount();
    const newCount = current + 1;
    localStorage.setItem(MESSAGE_COUNT_KEY, newCount.toString());
    return newCount;
  } catch {
    return 0;
  }
}

export function canSendAnonymousMessage(): boolean {
  return getAnonymousMessageCount() < MESSAGE_LIMIT;
}

export function getRemainingMessages(): number {
  return Math.max(0, MESSAGE_LIMIT - getAnonymousMessageCount());
}

export function resetMessageCount(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MESSAGE_COUNT_KEY);
  } catch {
    // Ignore errors
  }
}
