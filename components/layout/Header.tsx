import React from "react";
import { UserAvatar } from "../UserAvatar";
import Link from "next/link";

const HeaderComp = () => {
  return (
    <div className="flex flex-row justify-between items-center p-2 px-4">
      <Link
        href="/"
        className="text-gray-800 font-semibold hover:text-gray-600 w-fit flex items-center gap-2"
      >
        <p>LarryAI</p>
        <img className="w-6 h-6" src="/svg.svg" alt="Larry AI" />
      </Link>

      <div className="flex items-center gap-2">
        <UserAvatar />
      </div>
    </div>
  );
};

export default HeaderComp;
