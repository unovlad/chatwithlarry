"use server";

import { createClient } from "@/lib/supabaseServer";
import { createGuestChat } from "@/lib/guestService";
import { redirect } from "next/navigation";

export async function createChatAction(initialMessage?: string) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("createChatAction - user:", !!user, "authError:", authError);

    if (authError || !user) {
      // If user is not authenticated, create guest chat
      console.log("Creating guest chat with initial message:", initialMessage);
      const guestChat = await createGuestChat(initialMessage);
      console.log("Guest chat created:", guestChat);
      redirect(`/chat/${guestChat.id}`);
    }

    // Create chat in DB for authenticated user
    const chatTitle = initialMessage
      ? initialMessage.slice(0, 50) + (initialMessage.length > 50 ? "..." : "")
      : "New Chat";

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert([
        {
          user_id: user.id,
          title: chatTitle,
        },
      ])
      .select()
      .single();

    if (chatError) {
      console.error("Error creating chat:", chatError);
      throw new Error("Failed to create chat");
    }

    // If there is an initial message, create it in DB
    if (initialMessage) {
      const { error: messageError } = await supabase.from("messages").insert([
        {
          chat_id: chat.id,
          role: "user",
          content: initialMessage,
        },
      ]);

      if (messageError) {
        console.error("Error creating initial message:", messageError);
        // Don't throw error since chat is already created
      }
    }

    // Redirect to chat page
    redirect(`/chat/${chat.id}`);
  } catch (error) {
    // NEXT_REDIRECT - this is normal Next.js behavior, do not log as error
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect
    }
    console.error("Error in createChatAction:", error);
    throw error;
  }
}
