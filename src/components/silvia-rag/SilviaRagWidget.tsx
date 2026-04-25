"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "./SilviaRagWidget.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type RagMessage = {
  role: "user" | "assistant";
  text: string;
  citations?: Array<{ title?: string; source?: string }>;
};

export function SilviaRagWidget({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<RagMessage[]>([
    {
      role: "assistant",
      text: "Oi, sou a Silvia RAG. Posso tirar duvidas sobre documentos e inscricao.",
    },
  ]);

  const canSend = useMemo(() => question.trim().length >= 2 && !loading, [question, loading]);

  if (!enabled) return null;

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    const currentQuestion = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: currentQuestion }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/silvia-rag/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          session_id: sessionId,
        }),
      });
      if (!res.ok) throw new Error("Falha na consulta");
      const body = (await res.json()) as {
        answer?: string;
        citations?: Array<{ title?: string; source?: string }>;
      };
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: body.answer ?? "Nao consegui responder agora.",
          citations: body.citations ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Nao consegui consultar a base agora. Verifique se o Ollama e o backend estao ativos.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className={styles.fab} onClick={() => setOpen(true)} aria-label="Abrir chat da Silvia">
        <span className={styles.logoSilviIA}>
          <span className={styles.logoIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="url(#widgetLogoGrad)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
              <circle cx="12" cy="12" r="2.5" fill="url(#widgetLogoGrad)" />
              <defs>
                <linearGradient id="widgetLogoGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0795FF" />
                  <stop offset="1" stopColor="#004AAD" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className={styles.logoWord}>Silv</span>
          <span className={styles.logoIA}>IA</span>
        </span>
      </button>
    );
  }

  return (
    <section className={styles.panel} aria-label="Chat Silvia RAG">
      <header className={styles.header}>
        <h3 className={styles.title}>Silvia RAG</h3>
        <button type="button" className={styles.minBtn} onClick={() => setOpen(false)} aria-label="Minimizar chat">
          -
        </button>
      </header>

      <div className={styles.messages}>
        {messages.map((msg, idx) => (
          <article key={idx} className={msg.role === "user" ? styles.msgUser : styles.msgBot}>
            {msg.text}
            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className={styles.citations}>
                {msg.citations.slice(0, 3).map((c, cIdx) => (
                  <span key={cIdx} className={styles.citation}>
                    {c.title || c.source || "Fonte"}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <form className={styles.composer} onSubmit={onSend}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className={styles.input}
          placeholder="Pergunte sobre documentos..."
        />
        <button type="submit" className={styles.sendBtn} disabled={!canSend}>
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </section>
  );
}
