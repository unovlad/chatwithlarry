import { ChatList } from "@/components/ChatList";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Chats</h1>
        <ChatList />
      </div>
    </div>
  );
}


