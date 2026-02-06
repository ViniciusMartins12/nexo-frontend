"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import {
  ModalFuncionario,
  type FuncionarioCreated,
  type FuncionarioForEdit,
} from "@/components/ui/modal-funcionario";
import { Button } from "@/components/ui/button/button";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type FuncionarioItem = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[];
};

function formatCpfDisplay(cpf: string | null) {
  if (!cpf || cpf.length !== 11) return cpf ?? "—";
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: "Administrador",
    coordinator: "Coordenador",
    viewer: "Visualizador",
    atendente: "Atendente",
  };
  return map[role] ?? role;
}

export default function FuncionariosPage() {
  const [list, setList] = useState<FuncionarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] =
    useState<FuncionarioForEdit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/funcionarios`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar funcionários");
        return res.json();
      })
      .then((data: FuncionarioItem[]) =>
        setList(Array.isArray(data) ? data : [])
      )
      .catch(() => setError("Não foi possível carregar os funcionários."))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(newOne: FuncionarioCreated | undefined) {
    if (!newOne) return;
    setList((prev) => [
      {
        id: newOne.id,
        name: newOne.name,
        email: newOne.email,
        cpf: newOne.cpf,
        is_active: true,
        created_at: newOne.created_at,
        roles: [newOne.role],
      },
      ...prev,
    ]);
  }

  function handleOpenEdit(id: string) {
    fetch(`${API_URL}/funcionarios/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar funcionário");
        return res.json();
      })
      .then((data: FuncionarioForEdit) => {
        setEditingFuncionario(data);
        setIsModalOpen(true);
      })
      .catch(() => setError("Não foi possível carregar o funcionário."));
  }

  function handleUpdated(updated: FuncionarioItem) {
    setList((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f))
    );
    setEditingFuncionario(null);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingFuncionario(null);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este funcionário?"))
      return;
    setDeletingId(id);
    fetch(`${API_URL}/funcionarios/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao excluir");
        setList((prev) => prev.filter((f) => f.id !== id));
      })
      .catch(() => setError("Não foi possível excluir o funcionário."))
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
          <SkeletonList variant="card" count={6} className={styles.skeletonList} />
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
          <h1 className={styles.title}>Funcionários</h1>
          <h2 className={styles.subtitle}>
            Gerencie a equipe com acesso à plataforma
          </h2>
          <p className={styles.description}>
            Adicione funcionários com nome, CPF, email e função. Defina uma senha
            de acesso segura para cada um.
          </p>
          <div className={styles.cta}>
            <Button
              onClick={() => setIsModalOpen(true)}
              text="Novo funcionário"
            />
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.header}>
            <h1 className={styles.title}>Funcionários</h1>
            <Button
              onClick={() => setIsModalOpen(true)}
              text="Novo funcionário"
              size="md"
            />
          </div>
          <ul className={styles.list}>
            {list.map((f) => (
              <li key={f.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <h3 className={styles.cardTitle}>
                    {f.name ?? "—"}
                  </h3>
                  <span className={styles.cardEmail}>{f.email ?? "—"}</span>
                  <span className={styles.cardMeta}>
                    CPF {formatCpfDisplay(f.cpf)} ·{" "}
                    {f.roles.map(roleLabel).join(", ")}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    text="Editar"
                    onClick={() => handleOpenEdit(f.id)}
                    disabled={deletingId !== null}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    text="Excluir"
                    onClick={() => handleDelete(f.id)}
                    disabled={deletingId !== null}
                    loading={deletingId === f.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ModalFuncionario
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreated={handleCreated}
        initialFuncionario={editingFuncionario}
        onUpdated={handleUpdated}
      />
    </main>
  );
}
