import React from "react";
import { Button } from "../ui/button";
import { ActiveLink } from "../Navbar";
import Link from "next/link";
import { MessageCircle, Home } from "lucide-react";

const Header = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-gray-200">
      <div className="grid grid-cols-[1fr,auto] gap-2 p-4">
        <nav className="flex gap-4 flex-col md:flex-row md:items-center">
          <Link
            href="/"
            className="text-gray-800 font-semibold hover:text-gray-600"
          >
            LarryAI
          </Link>
          <div className="flex gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            <Link href="/chat">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chats</span>
              </Button>
            </Link>
          </div>
        </nav>

        <div className="flex justify-center">
          <Button
            asChild
            variant="outline"
            size="default"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <a href="https://x.com/uno_vlad" target="_blank">
              <span>Sign Up</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;
