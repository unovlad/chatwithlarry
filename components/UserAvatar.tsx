"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, MessageCircle } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";

export function UserAvatar() {
  const { user, signOut, getRemainingMessages } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSignIn = () => {
    setAuthMode("signin");
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignIn}
            className="text-gray-700 hover:text-gray-900"
          >
            Login
          </Button>
          <Button
            size="sm"
            onClick={handleSignUp}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign Up
          </Button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      </>
    );
  }

  const remainingMessages = getRemainingMessages();
  const displayName = user.full_name || user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((name: string) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200"
        >
          <span className="text-sm font-medium text-blue-700">{initials}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MessageCircle className="w-3 h-3" />
            <span>
              {remainingMessages === Infinity
                ? "Unlimited messages"
                : `${remainingMessages} messages left`}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {user.subscription_plan === "free" && "Free Plan"}
            {user.subscription_plan === "premium" && "Premium Plan"}
            {user.subscription_plan === "enterprise" && "Enterprise Plan"}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
