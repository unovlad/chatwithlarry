"use server";

import { createClient } from "@/lib/supabaseServer";
import { createGuestChat } from "@/lib/guestService";
import { redirect } from "next/navigation";

export async function createChatAction(initialMessage?: string) {
  try {
    const supabase = await createClient();

    // Отримуємо поточного користувача
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("createChatAction - user:", !!user, "authError:", authError);

    if (authError || !user) {
      // Якщо користувач не авторизований, створюємо гостьовий чат
      console.log("Creating guest chat with initial message:", initialMessage);
      const guestChat = await createGuestChat(initialMessage);
      console.log("Guest chat created:", guestChat);
      redirect(`/chat/${guestChat.id}`);
    }

    // Створюємо чат в БД для авторизованого користувача
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

    // Якщо є початкове повідомлення, створюємо його в БД
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
        // Не кидаємо помилку, оскільки чат вже створений
      }
    }

    // Редіректимо на сторінку чату
    redirect(`/chat/${chat.id}`);
  } catch (error) {
    // NEXT_REDIRECT - це нормальна поведінка Next.js, не логуємо як помилку
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Перекидаємо редірект
    }
    console.error("Error in createChatAction:", error);
    throw error;
  }
}
