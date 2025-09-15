import React from "react";
import { UserAvatar } from "../UserAvatar";
import Link from "next/link";

const MyHeader = () => {
  return (
    <header className="flex flex-row justify-between items-center p-2 px-4 bg-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link
        href="/"
        className="text-gray-800 font-semibold hover:text-gray-600 w-fit flex items-center gap-2"
      >
        <p>LarryAI</p>
      </Link>

      <div className="flex items-center gap-2">
        <UserAvatar />
      </div>
    </header>
  );
};

export default MyHeader;
