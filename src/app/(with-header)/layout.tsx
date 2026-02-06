"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header/header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function WithHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_URL}/auth/sync`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.type === "candidate") {
          router.replace("/candidato");
        }
      });
  }, [router]);

  return (
    <>
      <Header />
      {children}
    </>
  );
}
