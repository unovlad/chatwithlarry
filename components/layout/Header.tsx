import React from "react";
import { UserAvatar } from "../UserAvatar";
import Link from "next/link";
import { Plane } from "lucide-react";

const HeaderComp = () => {
  return (
    <header className="flex flex-row justify-between items-center p-2 px-4 bg-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link
        href="/"
        className="text-gray-800 font-semibold hover:text-gray-600 w-fit flex items-center gap-2"
      >
        <p>LarryAI</p>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/forecast"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Plane className="w-4 h-4" />
          <span>Turbulence Forecast</span>
        </Link>
        <UserAvatar />
      </div>
    </header>
  );
};

export default HeaderComp;
