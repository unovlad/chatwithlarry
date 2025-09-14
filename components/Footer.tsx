"use client";

import Link from "next/link";
import { Twitter, Linkedin } from "lucide-react";
import { cn } from "@/utils/cn";

export function Footer({
  fixed = true,
  marginTop = true,
}: {
  fixed?: boolean;
  marginTop?: boolean;
}) {
  return (
    <footer
      className={cn(
        "px-4 py-3 md:z-40",
        !marginTop ? "" : "mt-20",
        fixed ? "md:left-0 md:right-0 md:fixed md:bottom-0" : "",
      )}
    >
      <div className="w-full px-2 mx-auto flex justify-between items-center">
        {/* Social Links */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="https://x.com/talktolarry_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </Link>

            <Link
              href="https://x.com/talktolarry_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Legal Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/terms"
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
