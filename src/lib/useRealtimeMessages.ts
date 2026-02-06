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

/**
 * Inscreve em novas mensagens da conversa via Supabase Realtime.
 * Chama onNewMessage quando chega um INSERT em wallet_messages para essa conversa.
 */
export function useRealtimeMessages(
  conversationId: string | null,
  onNewMessage: (msg: RealtimeMessage) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    if (!conversationId || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
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
              if (row) {
                onNewMessageRef.current(rowToMessage(row));
              }
            }
          )
          .subscribe();

        if (!cancelled) {
          channelRef.current = channel;
        } else {
          channel.unsubscribe();
        }
      })
      .catch(() => {
        // Realtime opcional: falha silenciosa se token ou Supabase indisponível
      });

    return () => {
      cancelled = true;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [conversationId]);
}
