"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeMessages } from "@/lib/useRealtimeMessages";
import { useUnreadMessages } from "@/lib/UnreadMessagesContext";
import { playNotificationSound } from "@/lib/playNotificationSound";
import styles from "./page.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ConversationItem = {
  id: string | null;
  wallet_id: string;
  wallet_name: string;
  participant_id: string;
  participant_name: string;
  participant_email: string | null;
  last_message: string | null;
  last_message_at: string | null;
};

type Message = {
  id: string;
  sender_type: "candidate" | "attendant";
  sender_user_id: string | null;
  sender_name: string | null;
  body: string;
  created_at: string;
};

function formatTime(s: string) {
  if (!s) return "";
  const d = new Date(s);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MensagensPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentMessageIdRef = useRef<string | null>(null);
  const { addUnread, clearUnread } = useUnreadMessages();

  // Zerar contador ao abrir a tela de mensagens (atendente)
  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  const conversationIds = conversations
    .map((c) => c.id)
    .filter((id): id is string => id != null);
  const currentId = selected?.id ?? null;

  useRealtimeMessages(
    conversationIds,
    currentId,
    (msg) => {
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    },
    {
      isCandidate: false,
      onMessageFromOther: (convId, msg) => {
        // Som só quando CHEGA mensagem do outro (nunca quando envia)
        if (msg.id !== lastSentMessageIdRef.current) {
          playNotificationSound();
        }
        if (convId !== currentId) addUnread();
      },
    }
  );

  const fetchConversations = useCallback(() => {
    setLoadingList(true);
    setError(null);
    fetch(`${API_URL}/mensagens/conversas`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar conversas");
        return res.json();
      })
      .then((data: ConversationItem[]) => {
        setConversations(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Não foi possível carregar as conversas."))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    if (!selected.id) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    setLoadingMessages(true);
    fetch(
      `${API_URL}/mensagens/conversas/${selected.id}/mensagens`,
      { credentials: "include" }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar mensagens");
        return res.json();
      })
      .then((data: Message[]) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selected?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || sending) return;

    if (!selected) return;

    if (!selected.id) {
      setSending(true);
      setError(null);
      fetch(`${API_URL}/mensagens/conversas/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_id: selected.wallet_id,
          process_participant_id: selected.participant_id,
          body: text,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.message ?? `Erro ${res.status}`);
          }
          return res.json();
        })
        .then((data: { conversation_id: string; message: Message }) => {
          lastSentMessageIdRef.current = data.message.id;
          setMessages([data.message]);
          setInput("");
          setSelected((prev) =>
            prev
              ? { ...prev, id: data.conversation_id }
              : null
          );
          fetchConversations();
        })
        .catch((err) => {
        setError(err?.message ?? "Não foi possível enviar a mensagem. Verifique a conexão e se o backend está rodando.");
      })
        .finally(() => setSending(false));
      return;
    }

    setSending(true);
    setError(null);
    fetch(
      `${API_URL}/mensagens/conversas/${selected.id}/mensagens`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      }
    )
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message ?? `Erro ${res.status}`);
        }
        return res.json();
      })
      .then((msg: Message) => {
        lastSentMessageIdRef.current = msg.id;
        setMessages((prev) => [...prev, msg]);
        setInput("");
        fetchConversations();
      })
      .catch((err) => {
        setError(err?.message ?? "Não foi possível enviar a mensagem. Verifique a conexão e se o backend está rodando.");
      })
      .finally(() => setSending(false));
  };

  return (
    <main className={styles.container}>
      <div className={styles.chatLayout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Candidatos da carteira</h2>
          {loadingList ? (
            <p className={styles.loading}>Carregando...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : conversations.length === 0 ? (
            <p className={styles.empty}>
              Você não atende nenhuma carteira ou não há participantes nas suas
              carteiras.
            </p>
          ) : (
            <ul className={styles.conversationList}>
              {conversations.map((c) => (
                <li key={`${c.wallet_id}-${c.participant_id}`}>
                  <button
                    type="button"
                    className={`${styles.conversationItem} ${selected?.participant_id === c.participant_id && selected?.wallet_id === c.wallet_id ? styles.active : ""}`}
                    onClick={() => setSelected(c)}
                  >
                    <div className={styles.conversationAvatar}>
                      {c.participant_name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.conversationMeta}>
                      <span className={styles.conversationName}>
                        {c.participant_name}
                      </span>
                      <span className={styles.conversationWallet}>
                        {c.wallet_name}
                      </span>
                      {c.last_message && (
                        <span className={styles.conversationPreview}>
                          {c.last_message.length > 35
                            ? `${c.last_message.slice(0, 35)}...`
                            : c.last_message}
                        </span>
                      )}
                    </div>
                    {c.last_message_at && (
                      <span className={styles.conversationTime}>
                        {formatTime(c.last_message_at)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={styles.thread}>
          {!selected ? (
            <div className={styles.threadPlaceholder}>
              {conversations.length === 0 ? (
                <p>
                  Selecione um candidato à esquerda para iniciar a conversa.
                </p>
              ) : (
                <p>Selecione um candidato da sua carteira para conversar.</p>
              )}
            </div>
          ) : (
            <>
              <header className={styles.threadHeader}>
                <div className={styles.threadAvatar}>
                  {selected.participant_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className={styles.threadName}>{selected.participant_name}</h3>
                  <span className={styles.threadSubtitle}>
                    {selected.participant_email ?? "—"} · Carteira {selected.wallet_name}
                  </span>
                </div>
              </header>

              <div className={styles.messagesArea}>
                {!selected.id ? (
                  <p className={styles.hint}>
                    Inicie a conversa enviando uma mensagem abaixo.
                  </p>
                ) : loadingMessages ? (
                  <p className={styles.loading}>Carregando mensagens...</p>
                ) : (
                  <>
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={
                          m.sender_type === "attendant"
                            ? styles.messageOut
                            : styles.messageIn
                        }
                      >
                        <div className={styles.messageBubble}>
                          {m.sender_type === "attendant" && m.sender_name && (
                            <span className={styles.messageSender}>
                              {m.sender_name}
                            </span>
                          )}
                          {m.sender_type === "candidate" && (
                            <span className={styles.messageSender}>
                              Candidato
                            </span>
                          )}
                          <p className={styles.messageBody}>{m.body}</p>
                          <span className={styles.messageTime}>
                            {formatTime(m.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form
                className={styles.inputArea}
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
              >
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Digite sua mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className={styles.sendButton}
                  disabled={sending || !input.trim()}
                  aria-label="Enviar"
                >
                  Enviar
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
