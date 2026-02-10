"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/playNotificationSound";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Profissional",
  enterprise: "Enterprise",
};

export default function ConfiguracoesPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/company/plan`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { plan?: string } | null) => {
        setPlan(data?.plan ?? null);
      })
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, []);

  function handleSoundToggle(checked: boolean) {
    setSoundEnabled(checked);
    setNotificationSoundEnabled(checked);
  }

  return (
    <main className={styles.container}>
      <section className={styles.section}>
        <h1 className={styles.title}>Configurações</h1>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Notificações</h2>
          <label className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Som ao receber mensagem</span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => handleSoundToggle(e.target.checked)}
              className={styles.checkbox}
              aria-label="Ativar ou desativar som de notificação"
            />
          </label>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Plano da empresa</h2>
          {loading ? (
            <p className={styles.muted}>Carregando...</p>
          ) : (
            <p className={styles.planValue}>
              {plan ? PLAN_LABELS[plan] ?? plan : "Starter"}
            </p>
          )}
          <p className={styles.muted}>
            Planos disponíveis: Starter, Profissional e Enterprise. Entre em
            contato para alterar seu plano.
          </p>
        </div>
      </section>
    </main>
  );
}
