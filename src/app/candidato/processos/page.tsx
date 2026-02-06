"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ProcessItem = {
  process_id: string;
  process_name: string;
  process_type: string;
  start_date: string;
  end_date: string;
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

export default function CandidatoProcessosPage() {
  const [list, setList] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/candidato/processos`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data: ProcessItem[]) => setList(Array.isArray(data) ? data : []))
      .catch(() => setError("Não foi possível carregar seus processos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.skeletonHeader}>
          <Skeleton variant="title" />
        </div>
        <SkeletonList variant="card" count={5} className={styles.skeletonList} />
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.section}>
        <p className={styles.errorMsg}>{error}</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>Meus processos</h1>
      <p className={styles.description}>
        Processos em que você está inscrito. Clique em <strong>Ver</strong> para
        acessar as etapas de cadastro de cada processo.
      </p>
      {list.length === 0 ? (
        <p className={styles.empty}>
          Você ainda não está inscrito em nenhum processo. Entre em contato com
          a instituição para ser incluído em uma lista de participantes.
        </p>
      ) : (
        <ul className={styles.list}>
          {list.map((p) => (
            <li key={p.process_id} className={styles.card}>
              <div className={styles.cardMain}>
                <h3 className={styles.cardTitle}>{p.process_name}</h3>
                <span className={styles.cardType}>
                  {typeLabel(p.process_type)}
                </span>
                <span className={styles.cardDates}>
                  {formatDate(p.start_date)} → {formatDate(p.end_date)}
                </span>
              </div>
              <div className={styles.cardActions}>
                <Link
                  href={`/candidato/processos/${p.process_id}`}
                  className={styles.verButton}
                >
                  Ver
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
