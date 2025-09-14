// User types for Larry AI
export interface User {
  id: string;
  email: string;
  full_name?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Subscription
  subscription_plan: "free" | "premium" | "enterprise";
  subscription_status: "active" | "inactive" | "cancelled" | "past_due";
  subscription_start_date?: string;
  subscription_end_date?: string;

  // Stripe
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_payment_method_id?: string;
  stripe_default_payment_method?: string;
  stripe_invoice_settings?: Record<string, any>;
  stripe_metadata?: Record<string, any>;

  // Usage tracking
  messages_used: number;
  messages_limit: number;
  last_message_date?: string;
  monthly_reset_date: string;

  // Business logic
  trial_used: boolean;
  trial_start_date?: string;
  trial_end_date?: string;
  onboarding_completed: boolean;

  // Preferences
  timezone: string;
  language: string;
  notification_settings: Record<string, any>;
  user_preferences: Record<string, any>;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  canSendMessage: () => boolean;
  incrementMessageCount: () => Promise<void>;
  getRemainingMessages: () => number;
  createChat: (title: string) => Promise<Chat>;
  saveMessage: (
    chatId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ) => Promise<void>;
  loadChats: () => Promise<Chat[]>;
  loadMessages: (chatId: string) => Promise<Message[]>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  messages_limit: number;
}
