"use client";

/**
 * Realtime: novas mensagens aparecem sem refresh.
 * No Supabase: Database → Replication → inclua wallet_messages na publicação
 * (ou execute: ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_messages;)
 */
import { useEffect, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type RealtimeMessage = {
  id: string;
  sender_type: "candidate" | "attendant";
  sender_user_id: string | null;
  sender_name: string | null;
  body: string;
  created_at: string;
};

function rowToMessage(row: Record<string, unknown>): RealtimeMessage {
  return {
    id: String(row.id ?? ""),
    sender_type: (row.sender_type as "candidate" | "attendant") ?? "candidate",
    sender_user_id: row.sender_user_id != null ? String(row.sender_user_id) : null,
    sender_name: null,
    body: String(row.body ?? ""),
    created_at: row.created_at
      ? new Date(row.created_at as string).toISOString()
      : new Date().toISOString(),
  };
}

function isFromOtherParty(
  msg: RealtimeMessage,
  isCandidate: boolean
): boolean {
  return msg.sender_type === (isCandidate ? "attendant" : "candidate");
}

export type UseRealtimeMessagesOptions = {
  isCandidate: boolean;
  /** Chamado apenas quando CHEGA mensagem do outro (nunca quando o usuário envia). */
  onMessageFromOther?: (conversationId: string, msg: RealtimeMessage) => void;
};

/**
 * Inscreve em novas mensagens das conversas via Supabase Realtime.
 * - onMessageFromOther: chamado só quando CHEGA mensagem do outro (sender_type oposto).
 *   Use para som e badge; não é chamado quando o usuário envia.
 */
export function useRealtimeMessages(
  conversationIds: string[],
  currentConversationId: string | null,
  onNewMessage: (msg: RealtimeMessage) => void,
  options: UseRealtimeMessagesOptions
) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageFromOtherRef = useRef(options.onMessageFromOther);
  onNewMessageRef.current = onNewMessage;
  onMessageFromOtherRef.current = options.onMessageFromOther;
  const { isCandidate } = options;

  useEffect(() => {
    const ids = conversationIds.filter(Boolean);
    if (ids.length === 0 || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return undefined;
    }

    let cancelled = false;

    fetch(`${API_URL}/auth/realtime-token`, { credentials: "include" })
      .then((res) => {
        if (!res.ok || cancelled) return null;
        return res.json();
      })
      .then((data: { access_token?: string } | null) => {
        if (cancelled || !data?.access_token) return;

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          },
        });

        ids.forEach((conversationId) => {
          if (cancelled) return;

          const channel = supabase
            .channel(`wallet_messages:${conversationId}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "wallet_messages",
                filter: `conversation_id=eq.${conversationId}`,
              },
              (payload) => {
                const row = (payload as { new?: Record<string, unknown> }).new;
                if (!row) return;

                const msg = rowToMessage(row);
                const convId = String(row.conversation_id ?? conversationId);

                if (isFromOtherParty(msg, isCandidate)) {
                  onMessageFromOtherRef.current?.(convId, msg);
                }
                if (convId === currentConversationId) {
                  onNewMessageRef.current(msg);
                }
              }
            )
            .subscribe();

          channelsRef.current.push(channel);
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      channelsRef.current.forEach((ch) => {
        ch.unsubscribe();
      });
      channelsRef.current = [];
    };
  }, [
    conversationIds.join(","),
    currentConversationId,
    isCandidate,
  ]);
}
