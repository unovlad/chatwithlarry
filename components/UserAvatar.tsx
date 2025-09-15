"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  Settings,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";

export function UserAvatar() {
  const { user, signOut, getRemainingMessages, openAuthModal } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSignIn = () => {
    openAuthModal("signin");
  };

  const handleSignUp = () => {
    openAuthModal("signup");
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
        <div className="flex items-center gap-2">
          <p className="hidden sm:block text-sm text-gray-600">
            Welcome, {displayName}
          </p>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full bg-blue-100 hover:bg-blue-200"
          >
            <span className="text-sm font-medium text-blue-700">
              {initials}
            </span>
          </Button>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />
        <Link href="/chat">
          <DropdownMenuItem className="cursor-pointer">
            <MessageCircle className="mr-2 h-4 w-4" />
            <span>My Chats</span>
          </DropdownMenuItem>
        </Link>

        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>

        <DropdownMenuSeparator />

        <div className="px-2 py-1 flex flex-col gap-2">
          <div className="text-xs text-gray-500 mt-1">
            {user.subscription_plan === "free" && "Free Plan"}
            {user.subscription_plan === "premium" && "Premium Plan"}
            {user.subscription_plan === "enterprise" && "Enterprise Plan"}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MessageCircle className="w-3 h-3" />
            <span>
              {remainingMessages === Infinity
                ? "Unlimited messages"
                : `${remainingMessages} messages left`}
            </span>
          </div>
          <Button variant="active" size="sm">
            <Link href="/plans">Upgrade</Link>
          </Button>
        </div>
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
