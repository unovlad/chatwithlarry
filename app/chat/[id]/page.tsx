import { ChatWindow } from "@/components/ChatWindow";

interface ChatSessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatSessionPage({
  params,
}: ChatSessionPageProps) {
  const { id } = await params;

  return (
    <ChatWindow
      endpoint="/api/chat"
      emoji="✈️"
      placeholder="Ask Larry about your flight concerns..."
      sessionId={id}
    />
  );
}
