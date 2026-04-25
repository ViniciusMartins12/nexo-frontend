"use client";

import styles from "./page.module.scss";

export default function CandidatoSilviaPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Silvia</h1>
      <p className={styles.desc}>
        Assistente RAG para tirar dúvidas sobre documentos e inscrição.
      </p>
    </main>
  );
}
