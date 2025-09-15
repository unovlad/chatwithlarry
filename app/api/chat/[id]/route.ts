import { createClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: chatId } = await params;

    // Отримуємо поточного користувача
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Перевіряємо, чи належить чат користувачу
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("user_id")
      .eq("id", chatId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Видаляємо повідомлення чату
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("chat_id", chatId);

    if (messagesError) {
      console.error("Error deleting messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to delete messages" },
        { status: 500 },
      );
    }

    // Видаляємо чат
    const { error: deleteError } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId);

    if (deleteError) {
      console.error("Error deleting chat:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete chat" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/chat/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
