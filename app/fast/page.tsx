"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { FastChatWindow } from "@/components/FastChatWindow";

function FastChatWindowWrapper() {
  return <FastChatWindow />;
}

export default function FastPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to home
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // If user is authenticated, don't show page
  if (!loading && user) {
    return null;
  }

  // Show FastChatWindow immediately, without waiting for loading
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FastChatWindowWrapper />
    </Suspense>
  );
}
