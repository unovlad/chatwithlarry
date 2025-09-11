"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MessageCircle } from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastMessage?: string;
}

export function ChatList() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Завантажуємо збережені чати з localStorage
    const savedChats = localStorage.getItem("larry-chats");
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
        }));
        setChats(parsedChats);
      } catch (error) {
        console.error("Error parsing saved chats:", error);
      }
    }
  }, []);

  const handleNewChat = () => {
    router.push("/");
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">
          {chats.length === 0
            ? "No chats yet"
            : `${chats.length} chat${chats.length === 1 ? "" : "s"}`}
        </h2>
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
                  {chat.createdAt.toLocaleDateString()} at{" "}
                  {chat.createdAt.toLocaleTimeString()}
                </p>
              </CardHeader>
              {chat.lastMessage && (
                <CardContent>
                  <p className="text-gray-600 text-sm truncate">
                    {chat.lastMessage}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
