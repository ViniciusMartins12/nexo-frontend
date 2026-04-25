"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.scss";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STAT_LINKS = [
  { href: "/processos", label: "Processos ativos", src: "/icons/process.svg" },
  { href: "/carteiras", label: "Carteiras", src: "/icons/wallets.svg" },
  { href: "/funcionarios", label: "Funcionários", src: "/icons/user-add.svg" },
  { href: "/candidatos-autorizados", label: "Candidatos", src: "/icons/autorization.svg" },
] as const;

type ProcessItem = {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

type CarteiraItem = { id?: string; name?: string };

type DashboardData = {
  activeProcesses: ProcessItem[];
  carteiras: CarteiraItem[];
  funcionariosCount?: number;
  candidatosCount?: number;
};

function formatDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function typeLabel(type: string) {
  return type === "manutencao" ? "Manutenção de bolsas" : "Novo Processo";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/dashboard`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar dashboard");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Não foi possível carregar o dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.skeletonHero}>
            <Skeleton variant="title" className={styles.skeletonTitle} />
            <Skeleton variant="line" className={styles.skeletonSubtitle} />
            <Skeleton variant="line" count={2} className={styles.skeletonDesc} />
          </div>
          <div className={styles.skeletonCards}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="card" className={styles.skeletonCard} />
            ))}
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.skeletonBlockHeader}>
            <Skeleton variant="title" className={styles.skeletonBlockTitle} />
            <Skeleton variant="button" />
          </div>
          <SkeletonList variant="card" count={5} className={styles.skeletonList} />
        </section>
        <section className={styles.section}>
          <div className={styles.skeletonBlockHeader}>
            <Skeleton variant="title" className={styles.skeletonBlockTitle} />
            <Skeleton variant="button" />
          </div>
          <SkeletonList variant="card" count={3} className={styles.skeletonList} />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.container}>
        <section className={styles.section}>
          <p className={styles.errorMsg}>{error}</p>
        </section>
      </main>
    );
  }

  const activeProcesses = data?.activeProcesses ?? [];
  const carteiras = data?.carteiras ?? [];
  const funcionariosCount = data?.funcionariosCount ?? 0;
  const candidatosCount = data?.candidatosCount ?? 0;

  const statValues = [
    activeProcesses.length,
    carteiras.length,
    funcionariosCount,
    candidatosCount,
  ] as const;
  const statCards = STAT_LINKS.map((link, i) => ({ ...link, value: statValues[i] }));

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon} aria-hidden>
            <Image src="/icons/dash.svg" alt="" width={30} height={30} />
          </span>
          Dashboard
        </h1>
        <h2 className={styles.subtitle}>Visão geral da sua plataforma</h2>
        <p className={styles.description}>
          Acompanhe processos ativos, carteiras, funcionários e candidatos em um só lugar.
        </p>

        <div className={styles.cards}>
          {statCards.map((item) => (
            <Link key={item.href} href={item.href} className={styles.card}>
              <span className={styles.cardIconWrap} aria-hidden>
                <Image src={item.src} alt="" width={26} height={26} />
              </span>
              <span className={styles.cardLabel}>{item.label}</span>
              <span className={styles.cardValue}>{item.value}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.blockHeader}>
          <div className={styles.blockHeading}>
            <span className={styles.blockHeadingIcon} aria-hidden>
              <Image src="/icons/process.svg" alt="" width={22} height={22} />
            </span>
            <h3 className={styles.blockTitle}>Processos ativos</h3>
          </div>
          <Link href="/processos" className={styles.link}>
            Ver todos
          </Link>
        </div>
        {activeProcesses.length === 0 ? (
          <p className={styles.empty}>
            Nenhum processo ativo no momento.{" "}
            <Link href="/processos" className={styles.link}>
              Criar processo
            </Link>
          </p>
        ) : (
          <ul className={styles.list}>
            {activeProcesses.slice(0, 5).map((p) => (
              <li key={p.id} className={styles.cardItem}>
                <span className={styles.rowIcon} aria-hidden>
                  <Image src="/icons/process.svg" alt="" width={20} height={20} />
                </span>
                <div className={styles.cardMain}>
                  <span className={styles.cardItemTitle}>{p.name}</span>
                  <span className={styles.cardItemType}>{typeLabel(p.type)}</span>
                </div>
                <div className={styles.cardItemDates}>
                  {formatDate(p.start_date)} → {formatDate(p.end_date)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.blockHeader}>
          <div className={styles.blockHeading}>
            <span className={styles.blockHeadingIcon} aria-hidden>
              <Image src="/icons/wallets.svg" alt="" width={22} height={22} />
            </span>
            <h3 className={styles.blockTitle}>Carteiras</h3>
          </div>
          <Link href="/carteiras" className={styles.link}>
            Ir para carteiras
          </Link>
        </div>
        {carteiras.length === 0 ? (
          <p className={styles.empty}>
            Nenhuma carteira cadastrada.{" "}
            <Link href="/carteiras" className={styles.link}>
              Acessar carteiras
            </Link>
          </p>
        ) : (
          <ul className={styles.list}>
            {carteiras.map((c, i) => (
              <li key={c.id ?? i} className={`${styles.cardItem} ${styles.cardItemCompact}`}>
                <span className={styles.rowIcon} aria-hidden>
                  <Image src="/icons/wallets.svg" alt="" width={20} height={20} />
                </span>
                <span className={styles.carteiraName}>{c.name ?? "Carteira"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
