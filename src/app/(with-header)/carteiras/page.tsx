"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import {
  ModalCarteira,
  type CarteiraCreated,
  type CarteiraForEdit,
} from "@/components/ui/modal-carteira";
import { Button } from "@/components/ui/button/button";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type CarteiraItem = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  users: { user_id: string; name: string | null; email: string | null; role: string | null }[];
  processes: { process_id: string; name: string; type: string }[];
  participants?: { id: string; cpf: string; name: string; email: string | null; process_name: string }[];
};

function toItem(c: CarteiraCreated): CarteiraItem {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    created_at: c.created_at,
    users: [
      {
        user_id: c.responsible_id,
        name: c.responsible_name,
        email: null,
        role: "responsible",
      },
    ],
    processes: (c.process_names ?? []).map((name, i) => ({
      process_id: (c.process_ids ?? [])[i] ?? "",
      name,
      type: "",
    })),
    participants:
      "participants" in c && Array.isArray((c as { participants?: unknown }).participants)
        ? (c as { participants: CarteiraItem["participants"] }).participants
        : undefined,
  };
}

export default function CarteirasPage() {
  const [list, setList] = useState<CarteiraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarteira, setEditingCarteira] = useState<CarteiraForEdit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/carteiras`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar carteiras");
        return res.json();
      })
      .then((data: CarteiraItem[]) =>
        setList(Array.isArray(data) ? data : [])
      )
      .catch(() => setError("Não foi possível carregar as carteiras."))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(newOne: CarteiraCreated) {
    setList((prev) => [toItem(newOne), ...prev]);
  }

  function handleOpenEdit(id: string) {
    fetch(`${API_URL}/carteiras/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar carteira");
        return res.json();
      })
      .then((data: CarteiraForEdit) => {
        setEditingCarteira({
          ...data,
          responsible_id: data.responsible_id ?? null,
        });
        setIsModalOpen(true);
      })
      .catch(() => setError("Não foi possível carregar a carteira."));
  }

  function handleUpdated(updated: CarteiraCreated) {
    setList((prev) =>
      prev.map((c) => (c.id === updated.id ? toItem(updated) : c))
    );
    setEditingCarteira(null);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingCarteira(null);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir esta carteira?"))
      return;
    setDeletingId(id);
    fetch(`${API_URL}/carteiras/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao excluir");
        setList((prev) => prev.filter((c) => c.id !== id));
      })
      .catch(() => setError("Não foi possível excluir a carteira."))
      .finally(() => setDeletingId(null));
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <section className={styles.section}>
          <div className={styles.skeletonHeader}>
            <Skeleton variant="title" />
            <Skeleton variant="button" />
          </div>
          <SkeletonList variant="card" count={5} className={styles.skeletonList} />
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

  const isEmpty = list.length === 0;

  return (
    <main className={styles.container}>
      {isEmpty ? (
        <section className={styles.hero}>
          <h1 className={styles.title}>Carteiras</h1>
          <h2 className={styles.subtitle}>
            Crie carteiras e defina um responsável por cada uma
          </h2>
          <p className={styles.description}>
            Vincule funcionários e processos ativos em carteiras para organizar
            melhor o trabalho.
          </p>
          <div className={styles.cta}>
            <Button
              onClick={() => setIsModalOpen(true)}
              text="Nova carteira"
            />
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.header}>
            <h1 className={styles.title}>Carteiras</h1>
            <Button
              onClick={() => setIsModalOpen(true)}
              text="Nova carteira"
              size="md"
            />
          </div>
          <ul className={styles.list}>
            {list.map((c) => (
              <li key={c.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <h3 className={styles.cardTitle}>{c.name}</h3>
                  {c.description && (
                    <span className={styles.cardDesc}>{c.description}</span>
                  )}
                  <span className={styles.cardMeta}>
                    Responsável:{" "}
                    {c.users.map((u) => u.name ?? u.email ?? "—").join(", ") ||
                      "—"}
                  </span>
                  {c.processes.length > 0 && (
                    <span className={styles.cardMeta}>
                      Processos:{" "}
                      {c.processes.map((p) => p.name).join(", ")}
                    </span>
                  )}
                  {c.participants && c.participants.length > 0 && (
                    <span className={styles.cardMeta}>
                      Alunos: {c.participants.length} selecionado(s)
                    </span>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    text="Editar"
                    onClick={() => handleOpenEdit(c.id)}
                    disabled={deletingId !== null}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    text="Excluir"
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId !== null}
                    loading={deletingId === c.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ModalCarteira
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreated={handleCreated}
        initialCarteira={editingCarteira}
        onUpdated={handleUpdated}
      />
    </main>
  );
}
