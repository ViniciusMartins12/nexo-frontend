"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type CourseItem = {
  id: string;
  code: string;
  name: string;
  turno: string;
  semesters: number;
  created_at: string;
};

export default function CursosPage() {
  const [list, setList] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formTurno, setFormTurno] = useState("");
  const [formSemesters, setFormSemesters] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadList() {
    setLoading(true);
    fetch(`${API_URL}/institution-courses`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar cursos");
        return res.json();
      })
      .then((data: CourseItem[]) => setList(Array.isArray(data) ? data : []))
      .catch(() => setError("Não foi possível carregar os cursos."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadList();
  }, []);

  function openAdd() {
    setEditingId(null);
    setFormCode("");
    setFormName("");
    setFormTurno("");
    setFormSemesters("");
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(item: CourseItem) {
    setEditingId(item.id);
    setFormCode(item.code ?? "");
    setFormName(item.name);
    setFormTurno(item.turno);
    setFormSemesters(String(item.semesters));
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const semesters = parseInt(formSemesters, 10);
    if (!formCode.trim()) {
      setFormError("Código do curso é obrigatório.");
      return;
    }
    if (!formName.trim()) {
      setFormError("Nome do curso é obrigatório.");
      return;
    }
    if (!formTurno.trim()) {
      setFormError("Turno é obrigatório.");
      return;
    }
    if (!Number.isFinite(semesters) || semesters < 1 || semesters > 20) {
      setFormError("Semestres deve ser entre 1 e 20.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const body = { code: formCode.trim().toUpperCase(), name: formName.trim(), turno: formTurno.trim(), semesters };
    if (editingId) {
      fetch(`${API_URL}/institution-courses/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => { throw new Error(d?.message ?? "Erro ao salvar"); });
          return res.json();
        })
        .then((updated: CourseItem) => {
          setList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          closeModal();
        })
        .catch((err) => setFormError(err?.message ?? "Erro ao salvar. Tente novamente."))
        .finally(() => setSaving(false));
    } else {
      fetch(`${API_URL}/institution-courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => { throw new Error(d?.message ?? "Erro ao criar"); });
          return res.json();
        })
        .then((created: CourseItem) => {
          setList((prev) => [created, ...prev]);
          closeModal();
        })
        .catch((err) => setFormError(err?.message ?? "Erro ao criar. Tente novamente."))
        .finally(() => setSaving(false));
    }
  }

  function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este curso?")) return;
    setDeletingId(id);
    fetch(`${API_URL}/institution-courses/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao excluir");
        setList((prev) => prev.filter((c) => c.id !== id));
      })
      .catch(() => setError("Não foi possível excluir o curso."))
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
          <SkeletonList variant="card" count={8} className={styles.skeletonList} />
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

  return (
    <main className={styles.container}>
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>Cursos da instituição</h1>
          <Button text="Adicionar curso" onClick={openAdd} size="md" />
        </div>
        <p className={styles.description}>
          Inclua, edite ou exclua cursos oferecidos pela universidade (nome, turno e duração em semestres).
        </p>
        {list.length === 0 ? (
          <p className={styles.empty}>Nenhum curso cadastrado. Clique em &quot;Adicionar curso&quot; para começar.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Curso</th>
                  <th>Turno</th>
                  <th>Semestres</th>
                  <th className={styles.colActions}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td className={styles.cellCode}>{c.code}</td>
                    <td className={styles.cellName}>{c.name}</td>
                    <td>{c.turno}</td>
                    <td>{c.semesters}</td>
                    <td className={styles.colActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        text="Editar"
                        onClick={() => openEdit(c)}
                        disabled={!!deletingId}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        text="Excluir"
                        onClick={() => handleDelete(c.id)}
                        disabled={!!deletingId}
                        loading={deletingId === c.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingId ? "Editar curso" : "Novo curso"}
            </h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Código (único por instituição)"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Ex.: ADM-MAT, DIR-NOT"
              />
              <Input
                label="Nome do curso"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex.: Administração, Engenharia Civil"
              />
              <Input
                label="Turno"
                value={formTurno}
                onChange={(e) => setFormTurno(e.target.value)}
                placeholder="Ex.: Matutino, Noturno, Integral: Matutino/Vespertino"
              />
              <Input
                label="Duração (semestres)"
                variant="number"
                min={1}
                max={20}
                value={formSemesters}
                onChange={(e) => setFormSemesters(e.target.value)}
                placeholder="Ex.: 8"
              />
              {formError && <p className={styles.formError}>{formError}</p>}
              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" text="Cancelar" onClick={closeModal} />
                <Button type="submit" text={editingId ? "Salvar" : "Criar"} loading={saving} disabled={saving} />
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
