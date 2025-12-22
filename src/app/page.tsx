import Image from "next/image";
import styles from "./page.module.scss";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Image src="/svg/logo.svg" alt="Nexo" width={90} height={32} />
        </div>

        <nav className={styles.nav}>
          <a>Produto</a>
          <a>Planos</a>
          <a>Negócio</a>
          <a>Ajuda</a>
        </nav>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <h1>
          Gestão de documentos com IA
        </h1>

        <h2 className={styles.subtitle}>
          Envio, organização e rastreabilidade em um só lugar.
        </h2>

        <p className={styles.description}>
          Uma plataforma única para gestão de documentos, automação com IA
          e atendimento ao usuário em tempo real.
        </p>

        <div className={styles.cta}>
          <button className={styles.outline}>Criar conta</button>
           <Link href="/login" className={styles.primary}>
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}
