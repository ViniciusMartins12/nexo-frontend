import Image from "next/image";
import styles from "./page.module.scss";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image src="/svg/logo.svg" alt="Nexo" width={90} height={32} />
        </Link>

        <nav className={styles.nav}>
          <a href="#produto">Produto</a>
          <a href="#planos">Planos</a>
          <a href="#negocio">Negócio</a>
          <a href="#ajuda">Ajuda</a>
        </nav>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <h1>Gestão de documentos com IA</h1>
        <h2 className={styles.subtitle}>
          Envio, organização e rastreabilidade em um só lugar.
        </h2>
        <p className={styles.description}>
          Uma plataforma única para gestão de documentos, automação com IA e
          atendimento ao usuário em tempo real.
        </p>
        <div className={styles.cta}>
          <Link href="/cadastro-empresa" className={styles.outline}>
            Criar conta
          </Link>
          <Link href="/login" className={styles.primary}>
            Entrar
          </Link>
        </div>
      </section>

      {/* PRODUTO */}
      <section id="produto" className={styles.section}>
        <h2 className={styles.sectionTitle}>Produto</h2>
        <p className={styles.sectionDesc}>
          O Nexo centraliza processos seletivos, candidatos e comunicação.
          Crie processos e carteiras, envie editais, receba inscrições e
          documentação, e converse com candidatos em tempo real.
        </p>
        <ul className={styles.featureList}>
          <li>Processos seletivos com prazos e etapas</li>
          <li>Carteiras por responsável e processo</li>
          <li>Mensagens em tempo real com candidatos</li>
          <li>Gestão de documentos e automação com IA</li>
        </ul>
      </section>

      {/* PLANOS */}
      <section id="planos" className={styles.section}>
        <h2 className={styles.sectionTitle}>Planos</h2>
        <p className={styles.sectionDesc}>
          Escolha o plano ideal para o tamanho da sua operação. Valores mensais
          com opção de cobrança anual com desconto.
        </p>
        <div className={styles.planGrid}>
          <div className={styles.planCard}>
            <h3 className={styles.planName}>Starter</h3>
            <p className={styles.planPrice}>R$ 299/mês</p>
            <p className={styles.planBadge}>ou R$ 2.999/ano</p>
            <ul className={styles.planDesc}>
              <li>Até 2 processos por ano</li>
              <li>Até 300 candidatos por ano</li>
              <li>1 carteira e até 2 atendentes</li>
              <li>Até 20 GB para documentos</li>
            </ul>
          </div>
          <div className={styles.planCard}>
            <h3 className={styles.planName}>Profissional</h3>
            <p className={styles.planPrice}>R$ 799/mês</p>
            <p className={styles.planBadge}>ou R$ 7.999/ano</p>
            <ul className={styles.planDesc}>
              <li>Até 6 processos por ano</li>
              <li>Até 1.500 candidatos por ano</li>
              <li>Até 5 carteiras e 10 atendentes</li>
              <li>Até 100 GB para documentos</li>
              <li>Suporte prioritário</li>
            </ul>
          </div>
          <div className={styles.planCard}>
            <h3 className={styles.planName}>Enterprise</h3>
            <p className={styles.planPrice}>A partir de R$ 2.200/mês</p>
            <p className={styles.planBadge}>valores sob proposta</p>
            <ul className={styles.planDesc}>
              <li>Processos e candidatos em grande volume</li>
              <li>Limites de carteiras e atendentes sob medida</li>
              <li>Mais storage, performance dedicados e backups automáticos</li>
              <li>IA para aferição e validação documental</li>
              <li>SLA, integrações e implantação customizada</li>
            </ul>
          </div>
        </div>
      </section>

      {/* NEGÓCIO */}
      <section id="negocio" className={styles.section}>
        <h2 className={styles.sectionTitle}>Negócio</h2>
        <p className={styles.sectionDesc}>
          O Nexo foi pensado para instituições que realizam processos seletivos
          e precisam de organização, rastreabilidade e atendimento humanizado.
          Reduza retrabalho e centralize toda a jornada do candidato.
        </p>
      </section>

      {/* AJUDA */}
      <section id="ajuda" className={styles.section}>
        <h2 className={styles.sectionTitle}>Ajuda</h2>
        <p className={styles.sectionDesc}>
          Dúvidas sobre planos ou funcionalidades? Entre em contato pelo
          e-mail da sua conta ou fale com seu administrador. Para criar conta
          empresa, use &quot;Criar conta&quot; no topo; candidatos podem se
          cadastrar pela opção &quot;Fazer cadastro&quot; na tela de login.
        </p>
      </section>
    </main>
  );
}
