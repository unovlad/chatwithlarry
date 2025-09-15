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
    // Якщо користувач авторизований, перенаправляємо на головну
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Якщо користувач авторизований, не показуємо сторінку
  if (!loading && user) {
    return null;
  }

  // Показуємо FastChatWindow одразу, не чекаючи на loading
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FastChatWindowWrapper />
    </Suspense>
  );
}
