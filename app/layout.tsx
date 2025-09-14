import "./globals.css";
import { Public_Sans } from "next/font/google";
import { ActiveLink } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Link from "next/link";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { InstallPrompt } from "@/components/InstallPrompt";
import HeaderComp from "@/components/layout/header";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Larry AI - Flight Assistant</title>
        <meta
          name="description"
          content="AI-powered assistant for intelligent conversations and document analysis"
        />

        <link rel="shortcut icon" href="/images/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Larry AI" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Open Graph */}
        <meta property="og:title" content="Larry AI - Flight Assistant" />
        <meta
          property="og:description"
          content="Keep you help with your flights"
        />
        <meta property="og:image" content="/images/og-image.png" />
        <meta property="og:url" content="https://larry-ai.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Larry AI" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Larry AI - Flight Assistant" />
        <meta
          name="twitter:description"
          content="Keep you help with your flights"
        />
        <meta name="twitter:image" content="/images/og-image.png" />

        {/* Additional PWA Meta */}
        <meta name="application-name" content="Larry AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body className={publicSans.className}>
        <NuqsAdapter>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <HeaderComp />
              <div className="flex-1">{children}</div>
            </div>
            <InstallPrompt />
            <Toaster />
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
