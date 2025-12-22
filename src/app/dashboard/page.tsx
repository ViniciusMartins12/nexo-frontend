"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/");
      else setEmail(data.user.email ?? "");
    });
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Logado como: {email}</p>
      <button onClick={logout}>Sair</button>
    </main>
  );
}
