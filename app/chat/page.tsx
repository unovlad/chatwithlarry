"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatList } from "@/components/ChatList";
import { Footer } from "@/components/Footer";
import BlueGradientBackground from "@/components/BlueGradientBackground";

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function ChatPage() {
  const { user, loading, loadChats } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  useEffect(() => {
    // Якщо користувач не авторизований, перенаправляємо на головну
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Фетчимо чати коли користувач авторизований
    if (user && !loading) {
      const fetchChats = async () => {
        try {
          setChatsLoading(true);
          const userChats = await loadChats();
          setChats(userChats);
        } catch (error) {
          console.error("Error fetching chats:", error);
        } finally {
          setChatsLoading(false);
        }
      };

      fetchChats();
    }
  }, [user, loading, loadChats]);

  // Показуємо завантаження поки перевіряємо авторизацію
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Якщо користувач не авторизований, не показуємо сторінку
  if (!user) {
    return null;
  }

  return (
    <div className="w-full h-auto">
      <div className="max-w-4xl mx-auto py-8 px-4 bg-white ">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Chats</h1>
          <p className="text-gray-600">
            All your conversations with Larry, your flight companion
          </p>
        </div>

        {chatsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your chats...</p>
            </div>
          </div>
        ) : (
          <ChatList chats={chats} />
        )}
      </div>
      <Footer fixed marginTop={false} />
    </div>
  );
}
