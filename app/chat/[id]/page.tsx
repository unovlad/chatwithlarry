import { ChatWindow } from "@/components/ChatWindow";
import { createClient } from "@/lib/supabaseServer";
import { getGuestChat } from "@/lib/guestService";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, MessageCircle } from "lucide-react";
import Link from "next/link";

interface ChatSessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatSessionPage({
  params,
}: ChatSessionPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Отримуємо поточного користувача
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  let chat = null;
  let isGuestChat = false;

  if (user) {
    // Перевіряємо чи чат існує і чи має авторизований користувач до нього доступ
    const { data: userChat, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!chatError && userChat) {
      chat = userChat;
    }
  } else {
    // Перевіряємо чи це гостьовий чат
    console.log("Checking for guest chat with id:", id);
    const guestChat = await getGuestChat(id);
    if (guestChat) {
      console.log("Found guest chat:", guestChat);
      chat = guestChat;
      isGuestChat = true;
    } else {
      console.log("No guest chat found for id:", id);
    }
  }

  if (!chat) {
    return (
      <div className="mt-20  flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              Chat Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              This chat doesn't exist or you don't have access to it.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/chat">
                <Button className="w-full flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  View All Chats
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log(
    "Rendering ChatWindow with sessionId:",
    id,
    "isGuestChat:",
    isGuestChat,
  );

  return (
    <ChatWindow
      endpoint="/api/chat"
      placeholder="Ask Larry about your flight concerns..."
      sessionId={id}
      isGuestChat={isGuestChat}
    />
  );
}
