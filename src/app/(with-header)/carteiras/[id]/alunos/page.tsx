"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "../../page.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Participant = {
  id: string;
  cpf: string;
  name: string;
  email: string | null;
  process_name: string;
};

type CarteiraDetail = {
  id: string;
  name: string;
  description: string | null;
  participants?: Participant[];
};

export default function CarteiraAlunosPage() {
  const params = useParams();
  const walletId = params?.id as string;
  const [carteira, setCarteira] = useState<CarteiraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletId) return;
    fetch(`${API_URL}/carteiras/${walletId}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Carteira não encontrada");
        return res.json();
      })
      .then((data: CarteiraDetail) => {
        setCarteira({
          ...data,
          participants: data.participants ?? [],
        });
      })
      .catch(() => setError("Não foi possível carregar a carteira."))
      .finally(() => setLoading(false));
  }, [walletId]);

  if (loading) {
    return (
      <main className={styles.container}>
        <section className={styles.section}>
          <p className={styles.loading}>Carregando...</p>
        </section>
      </main>
    );
  }

  if (error || !carteira) {
    return (
      <main className={styles.container}>
        <section className={styles.section}>
          <p className={styles.errorMsg}>{error ?? "Carteira não encontrada."}</p>
          <Link href="/carteiras" className={styles.backLink}>
            ← Voltar às carteiras
          </Link>
        </section>
      </main>
    );
  }

  const participants = carteira.participants ?? [];

  return (
    <main className={styles.container}>
      <section className={styles.section}>
        <Link href="/carteiras" className={styles.backLink}>
          ← Voltar às carteiras
        </Link>
        <h1 className={styles.title}>{carteira.name}</h1>
        <p className={styles.description}>
          Alunos desta carteira. Clique em um aluno para ver a etapa do envio de documentos, formulários e anexos.
        </p>

        {participants.length === 0 ? (
          <p className={styles.empty}>Nenhum aluno vinculado a esta carteira.</p>
        ) : (
          <ul className={styles.list}>
            {participants.map((p) => (
              <li key={p.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <h3 className={styles.cardTitle}>{p.name}</h3>
                  <span className={styles.cardMeta}>
                    Processo: {p.process_name}
                  </span>
                  {p.email && (
                    <span className={styles.cardMeta}>{p.email}</span>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <Link href={`/carteiras/${walletId}/alunos/${p.id}`} className={styles.btnAcessar}>
                    Acessar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
