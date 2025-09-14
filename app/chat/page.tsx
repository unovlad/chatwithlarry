import { ChatList } from "@/components/ChatList";
import { Footer } from "@/components/Footer";
import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const supabase = await createClient();

  // Отримуємо поточного користувача
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  // Отримуємо всі чати користувача
  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (chatsError) {
    console.error("Error loading chats:", chatsError);
  }

  return (
    <div className="w-full h-auto">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Chats</h1>
          <p className="text-gray-600">
            All your conversations with Larry, your flight companion
          </p>
        </div>

        <ChatList chats={chats || []} />
      </div>
      <Footer fixed={false} />
    </div>
  );
}
