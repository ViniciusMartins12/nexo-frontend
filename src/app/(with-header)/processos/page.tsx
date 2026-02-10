"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import {
  Modal,
  type ProcessCreated,
  type ProcessForEdit,
} from "@/components/ui/modal/modal";
import { Button } from "@/components/ui/button/button";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { useCompanyAuth } from "@/lib/CompanyAuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function typeLabel(type: string) {
  return type === "manutencao" ? "Manutenção de bolsas" : "Novo Processo";
}

export default function ProcessosPage() {
  const { isAtendente } = useCompanyAuth();
  const [processes, setProcesses] = useState<ProcessCreated[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<ProcessForEdit | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/processes`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar processos");
        return res.json();
      })
      .then((data: ProcessCreated[]) =>
        setProcesses(Array.isArray(data) ? data : [])
      )
      .catch(() => setError("Não foi possível carregar os processos."))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(newProcess: ProcessCreated | undefined) {
    if (newProcess) setProcesses((prev) => [newProcess, ...prev]);
  }

  function handleOpenEdit(id: string) {
    fetch(`${API_URL}/processes/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar processo");
        return res.json();
      })
      .then((data: ProcessForEdit) => {
        setEditingProcess(data);
        setIsModalOpen(true);
      })
      .catch(() => setError("Não foi possível carregar o processo."));
  }

  function handleUpdated(updated: ProcessCreated) {
    setProcesses((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setEditingProcess(null);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingProcess(null);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este processo?"))
      return;
    setDeletingId(id);
    fetch(`${API_URL}/processes/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao excluir");
        setProcesses((prev) => prev.filter((p) => p.id !== id));
      })
      .catch(() => setError("Não foi possível excluir o processo."))
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

  const isEmpty = processes.length === 0;

  return (
    <main className={styles.container}>
      {isEmpty ? (
        <section className={styles.hero}>
          <h1 className={styles.title}>Processos</h1>
          <h2 className={styles.subtitle}>
            Crie processos para organizar candidatos, etapas e resultados em um
            só lugar.
          </h2>
          <p className={styles.description}>
            Uma plataforma única para gestão de documentos, automação com IA e
            atendimento ao usuário em tempo real.
          </p>
          {!isAtendente && (
            <div className={styles.cta}>
              <Button
                onClick={() => setIsModalOpen(true)}
                text="Criar Novo Processo"
              />
            </div>
          )}
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.header}>
            <h1 className={styles.title}>Processos</h1>
            {!isAtendente && (
              <Button
                onClick={() => setIsModalOpen(true)}
                text="Criar Novo Processo"
                size="md"
              />
            )}
          </div>
          <ul className={styles.list}>
            {processes.map((p) => (
              <li key={p.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <h3 className={styles.cardTitle}>{p.name}</h3>
                  <span className={styles.cardType}>
                    {typeLabel(p.type)}
                  </span>
                </div>
                <div className={styles.cardRight}>
                  <div className={styles.cardDates}>
                    <span>{formatDate(p.start_date)}</span>
                    <span className={styles.sep}>→</span>
                    <span>{formatDate(p.end_date)}</span>
                  </div>
                  {!isAtendente && (
                    <div className={styles.cardActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        text="Editar"
                        onClick={() => handleOpenEdit(p.id)}
                        disabled={deletingId !== null}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        text="Excluir"
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId !== null}
                        loading={deletingId === p.id}
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isAtendente && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCreated={handleCreated}
          initialProcess={editingProcess}
          onUpdated={handleUpdated}
        />
      )}
    </main>
  );
}
