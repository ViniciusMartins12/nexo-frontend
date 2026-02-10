"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/header/header";
import { useUnreadMessages } from "@/lib/UnreadMessagesContext";
import { useRealtimeMessages } from "@/lib/useRealtimeMessages";
import { playNotificationSound } from "@/lib/playNotificationSound";
import styles from "./layout.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ConversationItem = { id: string; [key: string]: unknown };

export default function CandidatoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const { addUnread } = useUnreadMessages();

  const conversationIds = conversations.map((c) => c.id);

  useRealtimeMessages(
    conversationIds,
    null,
    () => {},
    {
      isCandidate: true,
      onMessageFromOther: () => {
        playNotificationSound();
        addUnread();
      },
    }
  );

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

  useEffect(() => {
    if (!checked) return;
    fetch(`${API_URL}/candidato/mensagens/conversas`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ConversationItem[]) =>
        setConversations(Array.isArray(data) ? data : [])
      )
      .catch(() => setConversations([]));
  }, [checked]);

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
