"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtimeMessages } from "@/lib/useRealtimeMessages";
import styles from "./page.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Conversation = {
  id: string;
  wallet_id: string;
  wallet_name: string;
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

export default function CandidatoMensagensPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listFetched = useRef(false);

  useRealtimeMessages(selectedId, (msg) => {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
    );
  });

  const fetchConversations = useCallback(() => {
    setLoadingList(true);
    setError(null);
    fetch(`${API_URL}/candidato/mensagens/conversas`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar conversas");
        return res.json();
      })
      .then((data: Conversation[]) => {
        setConversations(Array.isArray(data) ? data : []);
        if (!listFetched.current && data?.length) {
          listFetched.current = true;
          setSelectedId(data[0].id);
        }
      })
      .catch(() => setError("Não foi possível carregar as conversas."))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetch(
      `${API_URL}/candidato/mensagens/conversas/${selectedId}/mensagens`,
      { credentials: "include" }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar mensagens");
        return res.json();
      })
      .then((data: Message[]) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    fetch(
      `${API_URL}/candidato/mensagens/conversas/${selectedId}/mensagens`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao enviar");
        return res.json();
      })
      .then((msg: Message) => {
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            sender_type: "candidate",
            sender_user_id: null,
            sender_name: null,
            body: msg.body,
            created_at: msg.created_at,
          },
        ]);
        setInput("");
        fetchConversations();
      })
      .catch(() => setError("Não foi possível enviar a mensagem."))
      .finally(() => setSending(false));
  };

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <main className={styles.container}>
      <div className={styles.chatLayout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Conversas</h2>
          {loadingList ? (
            <p className={styles.loading}>Carregando...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : conversations.length === 0 ? (
            <p className={styles.empty}>
              Você ainda não está em nenhuma carteira. Entre em contato com a
              instituição.
            </p>
          ) : (
            <ul className={styles.conversationList}>
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`${styles.conversationItem} ${selectedId === c.id ? styles.active : ""}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className={styles.conversationAvatar}>
                      {c.wallet_name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.conversationMeta}>
                      <span className={styles.conversationName}>
                        Atendente – {c.wallet_name}
                      </span>
                      {c.last_message && (
                        <span className={styles.conversationPreview}>
                          {c.last_message.length > 40
                            ? `${c.last_message.slice(0, 40)}...`
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
                <p>Selecione uma conversa ou aguarde ser incluído em uma carteira.</p>
              ) : (
                <p>Selecione uma conversa à esquerda.</p>
              )}
            </div>
          ) : (
            <>
              <header className={styles.threadHeader}>
                <div className={styles.threadAvatar}>
                  {selected.wallet_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className={styles.threadName}>
                    Atendente – {selected.wallet_name}
                  </h3>
                  <span className={styles.threadSubtitle}>
                    Tire suas dúvidas com o atendente da sua carteira
                  </span>
                </div>
              </header>

              <div className={styles.messagesArea}>
                {loadingMessages ? (
                  <p className={styles.loading}>Carregando mensagens...</p>
                ) : (
                  <>
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={
                          m.sender_type === "candidate"
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
