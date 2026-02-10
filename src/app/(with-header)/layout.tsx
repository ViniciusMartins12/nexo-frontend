"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Header } from "@/components/ui/header/header";
import { CompanyAuthProvider, useCompanyAuth } from "@/lib/CompanyAuthContext";
import { useUnreadMessages } from "@/lib/UnreadMessagesContext";
import { useRealtimeMessages } from "@/lib/useRealtimeMessages";
import { playNotificationSound } from "@/lib/playNotificationSound";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const ATENDENTE_BLOCKED_PATHS = ["/dashboard", "/funcionarios"];

type ConversationItem = {
  id: string | null;
  [key: string]: unknown;
};

function WithHeaderLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setSyncResult, isAtendente } = useCompanyAuth();
  const { addUnread } = useUnreadMessages();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const conversationIds = conversations
    .map((c) => c.id)
    .filter((id): id is string => id != null);

  useRealtimeMessages(
    conversationIds,
    null,
    () => {},
    {
      isCandidate: false,
      onMessageFromOther: () => {
        playNotificationSound();
        addUnread();
      },
    }
  );

  useEffect(() => {
    fetch(`${API_URL}/mensagens/conversas`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ConversationItem[]) =>
        setConversations(Array.isArray(data) ? data : [])
      )
      .catch(() => setConversations([]));
  }, []);

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
        if (!data) return;
        if (data.type === "candidate") {
          router.replace("/candidato");
          return;
        }
        if (data.type === "company" && data.user) {
          setSyncResult({
            type: "company",
            user: {
              id: data.user.id,
              email: data.user.email ?? null,
              name: data.user.name ?? null,
              companyId: data.user.companyId,
              roles: Array.isArray(data.user.roles) ? data.user.roles : [],
            },
          });
        }
      });
  }, [router, setSyncResult]);

  useEffect(() => {
    if (isAtendente && pathname && ATENDENTE_BLOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      router.replace("/processos");
    }
  }, [isAtendente, pathname, router]);

  return (
    <>
      <Header />
      {children}
    </>
  );
}

export default function WithHeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyAuthProvider>
      <WithHeaderLayoutInner>{children}</WithHeaderLayoutInner>
    </CompanyAuthProvider>
  );
}
