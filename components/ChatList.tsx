"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MessageCircle } from "lucide-react";

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ChatListProps {
  chats: Chat[];
}

export function ChatList({ chats }: ChatListProps) {
  const router = useRouter();

  const handleNewChat = () => {
    router.push("/");
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={handleNewChat} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {chats.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start your first conversation with Larry
            </p>
            <Button onClick={handleNewChat}>Start New Chat</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleChatClick(chat.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{chat.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  {new Date(chat.updated_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  at{" "}
                  {new Date(chat.updated_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
