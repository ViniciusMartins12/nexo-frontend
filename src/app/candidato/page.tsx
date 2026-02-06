"use client";

import styles from "./page.module.scss";

export default function CandidatoPage() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Área do candidato</h1>
      <p className={styles.description}>
        Bem-vindo à sua área. Acesse{" "}
        <a href="/candidato/processos" className={styles.link}>
          Meus processos
        </a>{" "}
        para ver os processos em que você está inscrito.
      </p>
    </section>
  );
}
