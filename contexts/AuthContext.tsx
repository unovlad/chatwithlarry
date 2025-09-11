"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { userService } from "@/lib/userService";
import type { User, Chat, Message, AuthContextType } from "@/types/user";
import { toast } from "sonner";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          // Профіль тепер створюється автоматично через trigger
          const userProfile = await userService.getUserProfile(session.user.id);
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      try {
        if (session?.user) {
          // Профіль тепер створюється автоматично через trigger
          const userProfile = await userService.getUserProfile(session.user.id);
          setUser(userProfile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);

      // Спочатку перевіряємо, чи існує користувач з таким email
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .single();

      if (existingUser) {
        toast.error("User already exists. Please sign in instead.");
        throw new Error("User already exists");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        // Обробляємо специфічні помилки Supabase
        if (
          error.message?.includes("User already registered") ||
          error.message?.includes("already been registered")
        ) {
          toast.error("User already exists. Please sign in instead.");
        } else {
          toast.error(error.message || "Failed to create account");
        }
        throw error;
      }

      if (data.user) {
        toast.success(
          "Account created successfully! Please check your email to verify your account.",
        );
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      // Помилка вже оброблена вище
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userProfile = await userService.getUserProfile(data.user.id);
        setUser(userProfile);
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      toast.success("Signed out successfully");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const canSendMessage = (): boolean => {
    return userService.canSendMessage(user);
  };

  const incrementMessageCount = async (): Promise<void> => {
    if (!user) return;

    try {
      await userService.incrementMessageCount(user.id);

      // Update local user state
      const updatedUser = await userService.getUserProfile(user.id);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Error incrementing message count:", error);
      throw error;
    }
  };

  const getRemainingMessages = (): number => {
    return userService.getRemainingMessages(user);
  };

  const createChat = async (title: string): Promise<Chat> => {
    if (!user) throw new Error("User not authenticated");

    try {
      const chat = await userService.createChat(user.id, title);
      return chat;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  };

  const saveMessage = async (
    chatId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ): Promise<void> => {
    try {
      await userService.saveMessage(chatId, role, content);
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  };

  const loadChats = async (): Promise<Chat[]> => {
    if (!user) return [];

    try {
      return await userService.getUserChats(user.id);
    } catch (error) {
      console.error("Error loading chats:", error);
      throw error;
    }
  };

  const loadMessages = async (chatId: string): Promise<Message[]> => {
    try {
      return await userService.getChatMessages(chatId);
    } catch (error) {
      console.error("Error loading messages:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    canSendMessage,
    incrementMessageCount,
    getRemainingMessages,
    createChat,
    saveMessage,
    loadChats,
    loadMessages,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
