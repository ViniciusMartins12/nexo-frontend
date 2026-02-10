"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/playNotificationSound";

export default function CandidatoConfiguracoesPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(isNotificationSoundEnabled());
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
          <p className={styles.muted}>
            Aqui você pode gerenciar suas preferências de conta e notificações.
          </p>
        </div>
      </section>
    </main>
  );
}
