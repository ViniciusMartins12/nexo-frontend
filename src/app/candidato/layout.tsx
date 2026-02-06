"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header/header";
import styles from "./layout.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CandidatoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

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
        setChecked(true);
        if (data?.type === "company") {
          router.replace("/dashboard");
        }
      });
  }, [router]);

  if (!checked) {
    return (
      <main className={styles.container}>
        <div className={styles.loading}>Carregando...</div>
      </main>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Header variant="candidate" />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
