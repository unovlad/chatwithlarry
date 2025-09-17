"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { userService } from "@/lib/userService";
import type { User, Chat, Message, AuthContextType } from "@/types/user";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth/AuthModal";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Log loading changes
  useEffect(() => {
    console.log("AuthContext: loading changed to:", loading);
  }, [loading]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">(
    "signin",
  );
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("AuthContext: Creating initial Supabase client...");
        const supabase = createClient();
        console.log("AuthContext: Getting initial session...");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log(
            "AuthContext: Initial session found, loading user profile via API...",
          );
          try {
            // Use API endpoint for quick profile retrieval
            const response = await fetch("/api/user/profile", {
              method: "GET",
              credentials: "include",
            });

            if (response.ok) {
              const { user: userProfile } = await response.json();
              console.log(
                "AuthContext: Initial user profile loaded via API:",
                userProfile,
              );
              setUser(userProfile);
            } else {
              console.log(
                "AuthContext: Failed to load profile via API, trying fallback...",
              );
              // Fallback to old method
              const userProfile = await userService.getUserProfile(
                session.user.id,
              );
              if (userProfile) {
                setUser(userProfile);
              }
            }
          } catch (error) {
            console.error(
              "AuthContext: Error loading initial user profile:",
              error,
            );
          }
        } else {
          console.log("AuthContext: No initial session found");
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        console.log("AuthContext: Setting initial loading to false");
        setLoading(false);
      }
    };

    getInitialSession();

    // Fallback: set loading to false after 5 seconds if something goes wrong
    const fallbackTimeout = setTimeout(() => {
      console.log("AuthContext: Fallback timeout - setting loading to false");
      setLoading(false);
    }, 5000);

    return () => clearTimeout(fallbackTimeout);

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log(
        "AuthContext: Auth state change:",
        event,
        session?.user?.id,
        "current loading:",
        loading,
      );

      // Avoid reprocessing if already processing auth event
      if (isProcessingAuth) {
        console.log("AuthContext: Already processing auth event, skipping");
        return;
      }

      setIsProcessingAuth(true);

      // Do NOT set loading = false immediately, wait for profile loading
      console.log(
        "AuthContext: Processing auth event:",
        event,
        "keeping loading true until profile loaded",
      );

      try {
        if (session?.user) {
          console.log(
            "AuthContext: Getting user profile for:",
            session.user.id,
          );
          // Use API endpoint for quick profile retrieval
          console.log("AuthContext: Attempting to get user profile via API...");
          let userProfile = null;

          try {
            console.log("AuthContext: Starting API call...");
            const response = await fetch("/api/user/profile", {
              method: "GET",
              credentials: "include",
            });

            if (response.ok) {
              const { user: profileData } = await response.json();
              userProfile = profileData;
              console.log(
                "AuthContext: User profile found via API:",
                userProfile,
              );
            } else {
              console.log("AuthContext: API failed, trying direct DB query...");
              // Fallback to direct DB query
              userProfile = await userService.getUserProfile(session.user.id);
              console.log(
                "AuthContext: User profile found in DB:",
                userProfile,
              );
            }
          } catch (apiError: any) {
            console.error(
              "AuthContext: Failed to get user profile via API:",
              apiError.message,
            );
            try {
              // Last fallback - direct DB query
              userProfile = await userService.getUserProfile(session.user.id);
              console.log(
                "AuthContext: User profile found in DB (fallback):",
                userProfile,
              );
            } catch (dbError: any) {
              console.error(
                "AuthContext: Failed to get user profile from DB:",
                dbError.message,
              );
              // If we cannot get profile from DB, create fallback profile
              console.log("AuthContext: Creating fallback user profile");
              userProfile = {
                id: session.user.id,
                email: session.user.email || "",
                full_name: session.user.user_metadata?.full_name || "",
                messages_used: 0,
                messages_limit: 3,
                subscription_plan: "free" as const,
                subscription_status: "active" as const,
                trial_used: false,
                trial_start_date: undefined,
                trial_end_date: undefined,
                onboarding_completed: false,
                monthly_reset_date: new Date().toISOString(),
                timezone: "UTC",
                language: "en",
                notification_settings: {},
                user_preferences: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
            }
          }

          // Use obtained profile (from DB or fallback)
          if (userProfile) {
            console.log("AuthContext: Using profile data:");
            console.log(
              "AuthContext: Full profile object:",
              JSON.stringify(userProfile, null, 2),
            );
            console.log("AuthContext: Profile ID:", userProfile.id);
            console.log("AuthContext: Profile email:", userProfile.email);
            console.log(
              "AuthContext: Profile full_name:",
              userProfile.full_name,
            );
            console.log(
              "AuthContext: Profile messages_used:",
              userProfile.messages_used,
            );
            console.log(
              "AuthContext: Profile messages_limit:",
              userProfile.messages_limit,
            );
            console.log(
              "AuthContext: Profile subscription_plan:",
              userProfile.subscription_plan,
            );
            console.log(
              "AuthContext: Profile subscription_status:",
              userProfile.subscription_status,
            );
            console.log(
              "AuthContext: Profile trial_used:",
              userProfile.trial_used,
            );
            console.log(
              "AuthContext: Profile onboarding_completed:",
              userProfile.onboarding_completed,
            );
          }

          console.log("AuthContext: Setting user state...");
          setUser(userProfile);
          console.log("AuthContext: User state set to:", userProfile?.id);

          // Force refresh session for server sync
          if (event === "SIGNED_IN") {
            console.log(
              "AuthContext: Force refreshing session for server sync...",
            );
            await supabase.auth.refreshSession();
          }
        } else {
          console.log("AuthContext: No session, setting user to null");
          setUser(null);
        }

        // Additional processing for SIGNED_OUT event
        if (event === "SIGNED_OUT") {
          console.log(
            "AuthContext: SIGNED_OUT event received, clearing user state",
          );
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error handling auth state change:", error);
        setUser(null);
      } finally {
        console.log(
          "AuthContext: Setting loading to false in finally block for event:",
          event,
        );
        setLoading(false);
        setIsProcessingAuth(false);
        console.log(
          "AuthContext: Loading set to false, isProcessingAuth set to false",
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);

      // First check if user with this email exists
      const { data: existingUser } = await createClient()
        .from("users")
        .select("id, email")
        .eq("email", email)
        .single();

      if (existingUser) {
        toast.error("User already exists. Please sign in instead.");
        throw new Error("User already exists");
      }

      const supabase = createClient();
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
        // Handle specific Supabase errors
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
      // Error already handled above
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Starting sign in process...");
      const supabase = createClient();
      console.log("Supabase client created, testing connection...");

      console.log("Calling signInWithPassword...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("signInWithPassword response:", {
        data: !!data,
        error: !!error,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        throw error;
      }

      console.log("Auth successful, user:", data.user?.id);
      toast.success("Welcome back!");

      // onAuthStateChange will automatically handle changes and update user state
      // Do not set setLoading(false) here, onAuthStateChange will do it
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    } finally {
      // Set loading to false only if there was no successful login
      // (on successful login onAuthStateChange will set loading to false)
      if (!user) {
        setLoading(false);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log("Starting Google OAuth...");
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        throw error;
      }

      console.log("Google OAuth redirect initiated");
      // For OAuth redirection happens through callback page
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast.error(error.message || "Failed to sign in with Google");
      throw error;
    } finally {
      // For OAuth do not set loading to false since redirection happens
      // setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("AuthContext: Starting sign out...");
      setLoading(true);
      const supabase = createClient();
      console.log("AuthContext: Calling supabase.auth.signOut()...");

      // Add timeout for signOut (increase to 5 seconds)
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sign out timeout")), 1000),
      );

      try {
        const { error } = (await Promise.race([
          signOutPromise,
          timeoutPromise,
        ])) as any;
        if (error) {
          console.error("AuthContext: Sign out error:", error);
          throw error;
        }
      } catch (timeoutError: any) {
        if (timeoutError.message === "Sign out timeout") {
          console.log(
            "AuthContext: Sign out timeout, continuing with local cleanup",
          );
        } else {
          throw timeoutError;
        }
      }

      console.log("AuthContext: Sign out successful, setting user to null");
      setUser(null);

      // Clear cookies for complete signOut
      console.log("AuthContext: Clearing cookies after successful signOut...");
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie =
          name +
          "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" +
          window.location.hostname;
      });
      window.location.reload();
      toast.success("Signed out successfully");

      // Redirect to home page
      router.push("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
      throw error;
    } finally {
      console.log("AuthContext: Sign out completed, setting loading to false");
      setLoading(false);
    }
  };

  const canSendMessage = (): boolean => {
    if (user) {
      return userService.canSendMessage(user);
    }
    return false;
  };

  const incrementMessageCount = async (): Promise<void> => {
    if (user) {
      try {
        console.log(
          "AuthContext: Starting incrementMessageCount for user:",
          user.id,
        );
        await userService.incrementMessageCount(user.id, user.messages_used);
        console.log("AuthContext: incrementMessageCount completed");

        // Update local user state with incremented value
        console.log("AuthContext: Updating local user state...");
        const updatedUser = {
          ...user,
          messages_used: user.messages_used + 1,
          last_message_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("AuthContext: User profile updated successfully");
        setUser(updatedUser);
      } catch (error) {
        console.error("AuthContext: Error incrementing message count:", error);
        throw error;
      }
    } else {
      console.log("AuthContext: No user found, skipping incrementMessageCount");
    }
  };

  const incrementTurbulenceCount = async (): Promise<void> => {
    if (user) {
      try {
        console.log(
          "AuthContext: Starting incrementTurbulenceCount for user:",
          user.id,
        );
        // Increment by 3 tokens for turbulence request
        await userService.incrementMessageCount(user.id, user.messages_used);
        await userService.incrementMessageCount(
          user.id,
          user.messages_used + 1,
        );
        await userService.incrementMessageCount(
          user.id,
          user.messages_used + 2,
        );
        console.log("AuthContext: incrementTurbulenceCount completed");

        // Update local user state with incremented value
        console.log("AuthContext: Updating local user state...");
        const updatedUser = {
          ...user,
          messages_used: user.messages_used + 3,
          last_message_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("AuthContext: User profile updated successfully");
        setUser(updatedUser);
      } catch (error) {
        console.error(
          "AuthContext: Error incrementing turbulence count:",
          error,
        );
        throw error;
      }
    } else {
      console.log(
        "AuthContext: No user found, skipping incrementTurbulenceCount",
      );
    }
  };

  const getRemainingMessages = (): number => {
    if (user) {
      return userService.getRemainingMessages(user);
    }
    return 0;
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
      console.log("AuthContext: Starting loadMessages for chatId:", chatId);

      // Increase timeout to 10 seconds
      const messagesPromise = userService.getChatMessages(chatId);
      const timeoutPromise = new Promise<Message[]>((_, reject) =>
        setTimeout(() => reject(new Error("loadMessages timeout")), 10000),
      );

      const messages = await Promise.race([messagesPromise, timeoutPromise]);
      console.log(
        "AuthContext: Messages loaded successfully:",
        messages.length,
      );
      return messages;
    } catch (error) {
      console.error("Error loading messages:", error);
      // Return empty array instead of throwing error
      return [];
    }
  };

  const openAuthModal = (mode: "signin" | "signup" = "signin") => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    canSendMessage,
    incrementMessageCount,
    incrementTurbulenceCount,
    getRemainingMessages,
    createChat,
    saveMessage,
    loadChats,
    loadMessages,
    openAuthModal,
    closeAuthModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        defaultMode={authModalMode}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("useAuth must be used within an AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
