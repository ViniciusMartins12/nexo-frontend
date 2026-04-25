import Image from "next/image";
import styles from "./page.module.scss";
import Link from "next/link";

const FEATURES = [
  {
    icon: "/icons/process.svg",
    title: "Processos",
    text: "Edital, etapas e prazos em um fluxo só.",
  },
  {
    icon: "/icons/wallets.svg",
    title: "Carteiras",
    text: "Organize por responsável e processo.",
  },
  {
    icon: "/icons/envelope.svg",
    title: "Mensagens",
    text: "Fale com candidatos em tempo real.",
  },
  {
    icon: "/icons/folder-ui.svg",
    title: "Docs + IA",
    text: "Validação assistida e rastreabilidade.",
  },
] as const;

export default function HomePage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image src="/svg/logo.svg" alt="Nexo" width={100} height={36} priority />
        </Link>

        <nav className={styles.nav} aria-label="Seções">
          <a href="#produto">Produto</a>
          <a href="#planos">Planos</a>
          <a href="#contato">Contato</a>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/login" className={styles.headerLink}>
            Entrar
          </Link>
          <Link href="/cadastro-empresa" className={styles.headerCta}>
            Criar conta
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Instituições · processos seletivos</p>
        <h1>Gestão de documentos com IA</h1>
        <p className={styles.heroLead}>
          Um lugar para processos, candidatos e documentação — sem dispersão.
        </p>
        <div className={styles.cta}>
          <Link href="/cadastro-empresa" className={styles.outline}>
            Começar
          </Link>
          <Link href="/login" className={styles.primary}>
            Entrar
          </Link>
        </div>
      </section>

      <section id="produto" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>O que você ganha</h2>
          <p className={styles.sectionKicker}>Menos retrabalho, mais controle.</p>
        </div>

        <ul className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <li key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon} aria-hidden>
                <Image src={f.icon} alt="" width={28} height={28} />
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureText}>{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="planos" className={styles.sectionMuted}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Planos</h2>
          <p className={styles.sectionKicker}>Mensal ou anual — escolha no cadastro.</p>
        </div>

        <div className={styles.planGrid}>
          <article className={styles.planCard}>
            <h3 className={styles.planName}>Starter</h3>
            <p className={styles.planPrice}>
              R$ 299<span>/mês</span>
            </p>
            <p className={styles.planBadge}>ou R$ 2.999/ano</p>
            <ul className={styles.planBullets}>
              <li>2 processos/ano · 300 candidatos</li>
              <li>1 carteira · 2 atendentes · 20 GB</li>
            </ul>
          </article>

          <article className={`${styles.planCard} ${styles.planFeatured}`}>
            <span className={styles.planRibbon}>Popular</span>
            <h3 className={styles.planName}>Profissional</h3>
            <p className={styles.planPrice}>
              R$ 799<span>/mês</span>
            </p>
            <p className={styles.planBadge}>ou R$ 7.999/ano</p>
            <ul className={styles.planBullets}>
              <li>6 processos/ano · 1.500 candidatos</li>
              <li>5 carteiras · 10 atendentes · 100 GB</li>
              <li>Suporte prioritário</li>
            </ul>
          </article>

          <article className={styles.planCard}>
            <h3 className={styles.planName}>Enterprise</h3>
            <p className={styles.planPrice}>A partir de R$ 2.200<span>/mês</span></p>
            <p className={styles.planBadge}>sob medida</p>
            <ul className={styles.planBullets}>
              <li>Volume alto · limites flexíveis</li>
              <li>IA documental · SLA · integrações</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="contato" className={styles.sectionNarrow}>
        <p className={styles.stripText}>
          Feito para quem precisa de{' '}
          <strong>organização</strong> e{' '}
          <strong>rastreabilidade</strong> na jornada do candidato.
        </p>
        <p className={styles.helpLine}>
          Dúvidas? <Link href="/login">Entre</Link> ou cadastre-se — candidatos pela opção no login.
        </p>
      </section>

      <footer className={styles.footer}>
        <span>Nexo</span>
      </footer>
    </main>
  );
}
