"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Dashboard</h1>
        <h2 className={styles.subtitle}>
          Visão geral da sua plataforma
        </h2>
        <p className={styles.description}>
          Acompanhe processos ativos, carteiras, funcionários e candidatos em um só lugar.
        </p>

        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Processos ativos</span>
            <span className={styles.cardValue}>{activeProcesses.length}</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Carteiras</span>
            <span className={styles.cardValue}>{carteiras.length}</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Funcionários</span>
            <span className={styles.cardValue}>{funcionariosCount}</span>
          </div>
          <div className={styles.card}>
            <span className={styles.cardLabel}>Candidatos</span>
            <span className={styles.cardValue}>{candidatosCount}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.blockHeader}>
          <h3 className={styles.blockTitle}>Processos ativos</h3>
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
                <div className={styles.cardMain}>
                  <span className={styles.cardItemTitle}>{p.name}</span>
                  <span className={styles.cardItemType}>
                    {typeLabel(p.type)}
                  </span>
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
          <h3 className={styles.blockTitle}>Carteiras</h3>
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
              <li key={c.id ?? i} className={styles.cardItem}>
                {c.name ?? "Carteira"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
