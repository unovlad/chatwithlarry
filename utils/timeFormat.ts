export function formatMessageTime(timestamp: string | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();

  // Перевіряємо чи це сьогодні
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    // Показуємо тільки час для сьогоднішніх повідомлень
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    // Показуємо дату і час для старих повідомлень
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
}

export function getRelativeTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    // 24 години
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    return formatMessageTime(timestamp);
  }
}
