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
    // Get chatId from params
    params.then(({ id }) => setChatId(id));
  }, [params]);

  // Remove automatic counter increment - this will be done when sending new message

  useEffect(() => {
    // If user is not authenticated, redirect to home
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Show loading only while checking authentication
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

  // If user is not authenticated, don't show page
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
