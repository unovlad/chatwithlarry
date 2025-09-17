import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authorization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete all user chats (cascade delete messages)
    const { error: chatsError } = await supabase
      .from("chats")
      .delete()
      .eq("user_id", user.id);

    if (chatsError) {
      console.error("Error deleting user chats:", chatsError);
      return NextResponse.json(
        { error: "Error deleting chats" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in chats deletion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
