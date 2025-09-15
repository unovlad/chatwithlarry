"use client";

import { ChatWindow } from "@/components/ChatWindow";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ChatSessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    // Отримуємо chatId з params
    params.then(({ id }) => setChatId(id));
  }, [params]);

  // Видаляємо автоматичне збільшення лічильника - це буде робитися при відправці нового повідомлення

  useEffect(() => {
    // Якщо користувач не авторизований, перенаправляємо на головну
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Показуємо завантаження тільки поки перевіряємо авторизацію
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
    <ChatWindow
      endpoint="/api/chat"
      placeholder="Ask Larry about your flight concerns..."
      sessionId={chatId || ""}
    />
  );
}
