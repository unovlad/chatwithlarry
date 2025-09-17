import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    console.log("API: Creating chat, checking auth...");
    const supabase = await createClient();
    const body = await req.json();
    const { initialMessage } = body;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("API: User auth result:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.log("API: User not authenticated, returning 401");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
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
      return NextResponse.json(
        { error: "Failed to create chat" },
        { status: 500 },
      );
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

    return NextResponse.json({ chatId: chat.id });
  } catch (error) {
    console.error("Error in create chat API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
