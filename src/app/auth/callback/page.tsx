"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    getSupabase().auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
      if (error) {
        console.error(error);
        router.replace("/");
        return;
      }
      router.replace("/dashboard");
    });
  }, [router]);

  return <p style={{ padding: 24 }}>Finalizando login...</p>;
}
