"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MessageCircle,
  MoreVertical,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useState } from "react";

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
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  const handleNewChat = () => {
    router.push("/");
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (deletingChatId) return;

    setDeletingChatId(chatId);
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setDeletingChatId(null);
    }
  };

  return (
    <div className="space-y-4">
      {chats.length > 0 && (
        <div className="flex justify-between items-center">
          <Button
            onClick={handleNewChat}
            className="flex items-center bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      )}

      {chats.length === 0 ? (
        <Card className="text-center py-12 bg-white z-10">
          <CardContent>
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start your first conversation with Larry
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleNewChat}
            >
              Start New Chat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              className=" shadow-none hover:shadow-sm transition-shadow hover:bg-gray-50 cursor-pointer"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <CardTitle className="text-lg">{chat.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(chat.updated_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}{" "}
                    at{" "}
                    {new Date(chat.updated_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleChatClick(chat.id)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteChat(chat.id)}
                      className="text-red-600 focus:text-red-600"
                      disabled={deletingChatId === chat.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingChatId === chat.id ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
