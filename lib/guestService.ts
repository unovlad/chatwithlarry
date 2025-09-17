"use server";

import { createClient } from "@supabase/supabase-js";

// Guest service uses SERVICE_ROLE_KEY to create chats without authorization
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface GuestChat {
  id: string;
  created_at: string;
  title: string;
  message_count: number;
}

export async function createGuestChat(
  initialMessage?: string,
): Promise<GuestChat> {
  try {
    // Create chat without user_id (guest)
    const chatTitle = initialMessage
      ? initialMessage.slice(0, 50) + (initialMessage.length > 50 ? "..." : "")
      : "Guest Chat";

    const { data: chat, error: chatError } = await supabaseAdmin
      .from("chats")
      .insert([
        {
          title: chatTitle,
          // user_id remains null for guest chats
        },
      ])
      .select()
      .single();

    if (chatError) {
      console.error("Error creating guest chat:", chatError);
      throw new Error("Failed to create guest chat");
    }

    // If there is an initial message, create it
    if (initialMessage) {
      const { error: messageError } = await supabaseAdmin
        .from("messages")
        .insert([
          {
            chat_id: chat.id,
            role: "user",
            content: initialMessage,
          },
        ]);

      if (messageError) {
        console.error("Error creating initial guest message:", messageError);
        // Don't throw error since chat is already created
      }
    }

    console.log("Created guest chat:", chat);

    return {
      id: chat.id,
      created_at: chat.created_at,
      title: chat.title,
      message_count: initialMessage ? 1 : 0,
    };
  } catch (error) {
    console.error("Error in createGuestChat:", error);
    throw error;
  }
}

export async function addGuestMessage(
  chatId: string,
  content: string,
  role: "user" | "assistant",
) {
  try {
    console.log("Adding guest message:", { chatId, content, role });

    const { error } = await supabaseAdmin.from("messages").insert([
      {
        chat_id: chatId,
        role,
        content,
      },
    ]);

    if (error) {
      console.error("Error adding guest message:", error);
      throw new Error("Failed to add message");
    }

    console.log("Guest message added successfully");
    return true;
  } catch (error) {
    console.error("Error in addGuestMessage:", error);
    throw error;
  }
}

export async function getGuestChat(chatId: string) {
  try {
    console.log("Getting guest chat for chatId:", chatId);

    const { data: chat, error: chatError } = await supabaseAdmin
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .is("user_id", null) // Only guest chats
      .single();

    if (chatError) {
      console.error("Error getting guest chat:", chatError);
      return null;
    }

    console.log("Found guest chat:", chat);
    return chat;
  } catch (error) {
    console.error("Error in getGuestChat:", error);
    return null;
  }
}

export async function getGuestChatMessages(chatId: string) {
  try {
    console.log("Getting guest chat messages for chatId:", chatId);

    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error getting guest chat messages:", error);
      return [];
    }

    console.log("Retrieved guest messages:", messages);
    return messages || [];
  } catch (error) {
    console.error("Error in getGuestChatMessages:", error);
    return [];
  }
}
