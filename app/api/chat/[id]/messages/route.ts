import { createClient } from "@/lib/supabaseServer";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: chatId } = await params;

    const profileHeader = request.headers.get("x-user-profile");
    if (profileHeader) {
      try {
        const profile = JSON.parse(profileHeader);
        console.log("API: Using profile from middleware headers for messages");

        // Отримуємо повідомлення з БД
        const supabase = await createClient();
        const { data: messages, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("API: Error getting messages:", error);
          if (error.code === "PGRST116") {
            return NextResponse.json({ messages: [] });
          }
          return NextResponse.json(
            { error: "Failed to get messages" },
            { status: 500 },
          );
        }

        console.log("API: Messages found:", messages?.length || 0);
        return NextResponse.json({ messages: messages || [] });
      } catch (parseError) {
        console.error("API: Failed to parse profile from headers:", parseError);
      }
    }

    // Fallback: отримуємо профіль з БД
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("API: Error getting messages:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ messages: [] });
      }
      return NextResponse.json(
        { error: "Failed to get messages" },
        { status: 500 },
      );
    }

    console.log("API: Messages found (fallback):", messages?.length || 0);
    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
