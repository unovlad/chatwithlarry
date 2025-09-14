import { createClient } from "@/lib/supabaseClient";
import type { User, Chat, Message } from "@/types/user";

export const userService = {
  // Check if user can send message
  canSendMessage: (user: User | null): boolean => {
    if (!user) return false;
    if (
      user.subscription_plan === "premium" ||
      user.subscription_plan === "enterprise"
    )
      return true;
    return user.messages_used < user.messages_limit;
  },

  // Get remaining messages
  getRemainingMessages: (user: User | null): number => {
    if (!user) return 0;
    if (
      user.subscription_plan === "premium" ||
      user.subscription_plan === "enterprise"
    )
      return Infinity;
    return Math.max(0, user.messages_limit - user.messages_used);
  },

  // Check if trial is active
  isTrialActive: (user: User | null): boolean => {
    if (!user || !user.trial_start_date || !user.trial_end_date) return false;
    const now = new Date();
    const trialEnd = new Date(user.trial_end_date);
    return now < trialEnd;
  },

  // Get subscription display name
  getSubscriptionDisplayName: (user: User | null): string => {
    if (!user) return "Not logged in";
    switch (user.subscription_plan) {
      case "free":
        return "Free Plan";
      case "premium":
        return "Premium Plan";
      case "enterprise":
        return "Enterprise Plan";
      default:
        return "Unknown Plan";
    }
  },

  // Create user profile after signup (тепер не використовується - профіль створюється автоматично)
  createUserProfile: async (
    userId: string,
    email: string,
    fullName?: string,
  ): Promise<User> => {
    // Ця функція більше не використовується
    // Профіль створюється автоматично через database trigger
    throw new Error(
      "User profile is created automatically via database trigger",
    );
  },

  // Get user profile
  getUserProfile: async (userId: string): Promise<User | null> => {
    const { data, error } = await createClient()
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  },

  // Update user profile
  updateUserProfile: async (
    userId: string,
    updates: Partial<User>,
  ): Promise<User> => {
    const { data, error } = await createClient()
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Increment message count
  incrementMessageCount: async (userId: string): Promise<void> => {
    // First get current user data
    const { data: userData, error: fetchError } = await createClient()
      .from("users")
      .select("messages_used")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    // Then update with incremented value
    const { error } = await createClient()
      .from("users")
      .update({
        messages_used: (userData.messages_used || 0) + 1,
        last_message_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  },

  // Reset monthly message count
  resetMonthlyMessages: async (userId: string): Promise<void> => {
    const { error } = await createClient()
      .from("users")
      .update({
        messages_used: 0,
        monthly_reset_date: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  },

  // Create chat
  createChat: async (userId: string, title: string): Promise<Chat> => {
    const { data, error } = await createClient()
      .from("chats")
      .insert([
        {
          user_id: userId,
          title,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error in userService.createChat:", error);
      throw error;
    }
    return data;
  },

  // Get user chats
  getUserChats: async (userId: string): Promise<Chat[]> => {
    const { data, error } = await createClient()
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get chat messages
  getChatMessages: async (chatId: string): Promise<Message[]> => {
    const { data, error } = await createClient()
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      // Якщо помилка (наприклад, чат не існує або немає доступу), повертаємо порожній масив
      if (
        error.code === "PGRST116" ||
        error.message?.includes("permission denied")
      ) {
        return [];
      }
      throw error;
    }
    return data || [];
  },

  // Save message
  saveMessage: async (
    chatId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ): Promise<Message> => {
    const { data, error } = await createClient()
      .from("messages")
      .insert([
        {
          chat_id: chatId,
          role,
          content,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Оновлюємо updated_at в чаті
    await createClient()
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return data;
  },

  // Update chat title
  updateChatTitle: async (
    chatId: string,
    userId: string,
    title: string,
  ): Promise<Chat> => {
    const { data, error } = await createClient()
      .from("chats")
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete chat
  deleteChat: async (chatId: string, userId: string): Promise<void> => {
    const { error } = await createClient()
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};
