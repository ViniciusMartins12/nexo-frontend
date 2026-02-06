"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./modal-carteira.module.scss";
import { Input } from "../input/input";
import { Button } from "../button/button";
import { Stepper, Step, useStepper } from "../modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STEPS = ["Nome", "Responsável", "Processos"];

type UserItem = {
  id: string;
  name: string;
  email: string | null;
  cpf: string | null;
};

type ProcessItem = {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
};

type ParticipantItem = {
  id: string;
  cpf: string;
  email: string | null;
  name: string;
  process_id: string;
  process_name: string;
  process_type: string;
  created_at: string;
};

export type CarteiraCreated = {
  id: string;
  name: string;
  description: string | null;
  responsible_id: string;
  responsible_name: string | null;
  process_ids: string[];
  process_names: string[];
  participant_ids?: string[];
  created_at: string;
};

export type CarteiraForEdit = {
  id: string;
  name: string;
  description: string | null;
  responsible_id: string | null;
  responsible_name: string | null;
  atendente_ids?: string[];
  process_ids: string[];
  process_names: string[];
  participant_ids?: string[];
  participants?: { id: string; cpf: string; name: string; email: string | null; process_name: string }[];
  created_at: string;
};

type ModalCarteiraProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (carteira: CarteiraCreated) => void;
  initialCarteira?: CarteiraForEdit | null;
  onUpdated?: (carteira: CarteiraCreated) => void;
};

function formatCpf(cpf: string | null) {
  if (!cpf || cpf.length !== 11) return cpf ?? "—";
  const d = cpf.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function StepIndicator({
  current,
  labels,
}: {
  current: number;
  labels: string[];
}) {
  return (
    <div className={styles.steps} role="tablist" aria-label="Etapas">
      {labels.map((label, i) => (
        <div
          key={i}
          className={`${styles.stepDot} ${i === current ? styles.active : ""} ${i < current ? styles.done : ""}`}
          aria-current={i === current ? "step" : undefined}
        >
          <span className={styles.stepNum}>{i + 1}</span>
          <span className={styles.stepLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function ModalCarteiraContent({
  name,
  setName,
  description,
  setDescription,
  users,
  processes,
  userSearch,
  setUserSearch,
  processSearch,
  setProcessSearch,
  selectedUserId,
  setSelectedUserId,
  selectedAtendenteIds,
  toggleAtendenteId,
  selectedProcessIds,
  toggleProcessId,
  onClose,
  onCreated,
  editingId,
  onUpdated,
  participants,
  alumniFilter,
  setAlumniFilter,
  selectedParticipantIds,
  toggleParticipantId,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  users: UserItem[];
  processes: ProcessItem[];
  userSearch: string;
  setUserSearch: (v: string) => void;
  processSearch: string;
  setProcessSearch: (v: string) => void;
  selectedUserId: string | null;
  setSelectedUserId: (v: string | null) => void;
  selectedAtendenteIds: string[];
  toggleAtendenteId: (id: string) => void;
  selectedProcessIds: string[];
  toggleProcessId: (id: string) => void;
  onClose: () => void;
  onCreated?: (c: CarteiraCreated) => void;
  editingId: string | null;
  onUpdated?: (c: CarteiraCreated) => void;
  participants: ParticipantItem[];
  alumniFilter: string;
  setAlumniFilter: (v: string) => void;
  selectedParticipantIds: string[];
  toggleParticipantId: (id: string) => void;
}) {
  const { currentStep, nextStep, prevStep } = useStepper();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isEdit = !!editingId;

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.cpf?.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ?? false)
    );
  }, [users, userSearch]);

  const filteredProcesses = useMemo(() => {
    const q = processSearch.trim().toLowerCase();
    if (!q) return processes;
    return processes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
  }, [processes, processSearch]);

  const filteredAlunos = useMemo(() => {
    const q = alumniFilter.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    if (!q) return participants;
    return participants.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (qDigits.length > 0 && a.cpf.replace(/\D/g, "").includes(qDigits)) ||
        a.process_name.toLowerCase().includes(q) ||
        (a.email?.toLowerCase().includes(q) ?? false)
    );
  }, [participants, alumniFilter]);

  async function handleSubmit() {
    if (!selectedUserId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = isEdit
        ? `${API_URL}/carteiras/${editingId}`
        : `${API_URL}/carteiras`;
      const method = isEdit ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        responsible_id: selectedUserId,
        atendente_ids: selectedAtendenteIds.length ? selectedAtendenteIds : undefined,
        process_ids: selectedProcessIds.length ? selectedProcessIds : undefined,
        participant_ids: selectedParticipantIds.length ? selectedParticipantIds : undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
        setErrorMsg(msg ?? (isEdit ? "Erro ao atualizar carteira" : "Erro ao criar carteira"));
        return;
      }
      if (isEdit) onUpdated?.(data);
      else onCreated?.(data);
      onClose();
    } catch {
      setErrorMsg("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StepIndicator current={currentStep} labels={STEPS} />

      <Step step={0}>
        <div className={styles.stepContent}>
          <p className={styles.stepDesc}>Defina um nome para a carteira.</p>
          <Input
            label="Nome da carteira"
            variant="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Carteira Prouni 2026"
            maxLength={200}
          />
          <div className={styles.wrapperTextarea}>
            <label className={styles.label}>Descrição (opcional)</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição da carteira"
              rows={2}
              maxLength={2000}
            />
          </div>
          <div className={styles.stepActions}>
            <Button
              text="Próximo"
              onClick={nextStep}
              disabled={name.trim().length < 2}
            />
          </div>
        </div>
      </Step>

      <Step step={1}>
        <div className={styles.stepContent}>
          <p className={styles.stepDesc}>
            Selecione o funcionário responsável por esta carteira.
          </p>
          <Input
            label="Buscar por nome, email ou CPF"
            variant="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Filtrar..."
          />
          <ul className={styles.optionList}>
            {filteredUsers.length === 0 ? (
              <li className={styles.optionEmpty}>
                {users.length === 0
                  ? "Nenhum funcionário na empresa."
                  : "Nenhum resultado para o filtro."}
              </li>
            ) : (
              filteredUsers.map((u) => (
                <li
                  key={u.id}
                  className={`${styles.optionItem} ${selectedUserId === u.id ? styles.selected : ""}`}
                  onClick={() => setSelectedUserId(u.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setSelectedUserId(u.id);
                  }}
                >
                  <span className={styles.optionName}>{u.name}</span>
                  {u.email && (
                    <span className={styles.optionMeta}>{u.email}</span>
                  )}
                  {u.cpf && (
                    <span className={styles.optionMeta}>
                      CPF {formatCpf(u.cpf)}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
          <p className={styles.stepDesc}>
            Opcional: selecione atendentes que poderão ver esta carteira e os alunos.
          </p>
          <ul className={styles.optionList}>
            {filteredUsers
              .filter((u) => u.id !== selectedUserId)
              .map((u) => {
                const isAtendente = selectedAtendenteIds.includes(u.id);
                return (
                  <li
                    key={u.id}
                    className={`${styles.optionItem} ${styles.multiSelect} ${isAtendente ? styles.selected : ""}`}
                    onClick={() => toggleAtendenteId(u.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        toggleAtendenteId(u.id);
                    }}
                  >
                    <span className={styles.checkbox}>
                      {isAtendente ? "☑" : "☐"}
                    </span>
                    <span className={styles.optionName}>{u.name}</span>
                    {u.email && (
                      <span className={styles.optionMeta}>{u.email}</span>
                    )}
                  </li>
                );
              })}
          </ul>
          <div className={styles.stepActions}>
            <Button variant="ghost" text="Voltar" onClick={prevStep} />
            <Button
              text="Próximo"
              onClick={nextStep}
              disabled={!selectedUserId}
            />
          </div>
        </div>
      </Step>

      <Step step={2}>
        <div className={styles.stepContent}>
          <p className={styles.stepDesc}>
            Opcional: vincule a um ou mais processos ativos.
          </p>
          <Input
            label="Buscar processo"
            variant="text"
            value={processSearch}
            onChange={(e) => setProcessSearch(e.target.value)}
            placeholder="Filtrar por nome ou tipo..."
          />
          <ul className={styles.optionList}>
            {filteredProcesses.map((p) => {
              const isSelected = selectedProcessIds.includes(p.id);
              return (
                <li
                  key={p.id}
                  className={`${styles.optionItem} ${styles.multiSelect} ${isSelected ? styles.selected : ""}`}
                  onClick={() => toggleProcessId(p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      toggleProcessId(p.id);
                  }}
                >
                  <span className={styles.checkbox}>
                    {isSelected ? "☑" : "☐"}
                  </span>
                  <span className={styles.optionName}>{p.name}</span>
                  <span className={styles.optionMeta}>{p.type}</span>
                </li>
              );
            })}
            {filteredProcesses.length === 0 && (
              <li className={styles.optionEmpty}>
                {processes.length === 0
                  ? "Nenhum processo ativo no momento."
                  : "Nenhum resultado para o filtro."}
              </li>
            )}
          </ul>

          <div className={styles.alunosSection}>
            <h3 className={styles.alunosSectionTitle}>
              Alunos — selecione os que deseja adicionar à carteira
            </h3>
            <div className={styles.alunosFilterWrap}>
              <Input
                label="Filtrar alunos"
                variant="text"
                value={alumniFilter}
                onChange={(e) => setAlumniFilter(e.target.value)}
                placeholder="Nome, CPF, email ou processo..."
              />
            </div>
            <div className={styles.alunosTableWrap}>
              {filteredAlunos.length === 0 ? (
                <p className={styles.alunosEmpty}>
                  {participants.length === 0
                    ? "Nenhum participante cadastrado nos processos."
                    : "Nenhum aluno encontrado para o filtro."}
                </p>
              ) : (
                <table className={styles.alunosTable}>
                  <thead>
                    <tr>
                      <th className={styles.colSelect}>Incluir</th>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Email</th>
                      <th>Processo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlunos.map((a) => {
                      const isSelected = selectedParticipantIds.includes(a.id);
                      return (
                        <tr
                          key={a.id}
                          className={isSelected ? styles.rowSelected : ""}
                          onClick={() => toggleParticipantId(a.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              toggleParticipantId(a.id);
                          }}
                        >
                          <td className={styles.colSelect}>
                            <span className={styles.checkbox}>
                              {isSelected ? "☑" : "☐"}
                            </span>
                          </td>
                          <td>{a.name}</td>
                          <td>{formatCpf(a.cpf)}</td>
                          <td>{a.email ?? "—"}</td>
                          <td>{a.process_name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={styles.stepActions}>
            <Button variant="ghost" text="Voltar" onClick={prevStep} />
            <Button
              text={isEdit ? "Salvar alterações" : "Criar carteira"}
              onClick={handleSubmit}
              loading={loading}
            />
          </div>
        </div>
      </Step>

      {errorMsg && <p className={styles.error}>{errorMsg}</p>}
    </>
  );
}

export function ModalCarteira({
  isOpen,
  onClose,
  onCreated,
  initialCarteira,
  onUpdated,
}: ModalCarteiraProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [processSearch, setProcessSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedAtendenteIds, setSelectedAtendenteIds] = useState<string[]>([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState<string[]>([]);

  function toggleAtendenteId(id: string) {
    setSelectedAtendenteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [alumniFilter, setAlumniFilter] = useState("");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  function toggleParticipantId(id: string) {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    if (!isOpen) return;
    if (initialCarteira) {
      setName(initialCarteira.name);
      setDescription(initialCarteira.description ?? "");
      setSelectedUserId(initialCarteira.responsible_id ?? null);
      setSelectedAtendenteIds(initialCarteira.atendente_ids ?? []);
      setSelectedProcessIds(initialCarteira.process_ids ?? []);
      setSelectedParticipantIds(initialCarteira.participant_ids ?? []);
    } else {
      setName("");
      setDescription("");
      setSelectedUserId(null);
      setSelectedAtendenteIds([]);
      setSelectedProcessIds([]);
      setSelectedParticipantIds([]);
    }
    setUserSearch("");
    setProcessSearch("");
    setAlumniFilter("");
    fetch(`${API_URL}/carteiras/users`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: UserItem[]) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
    fetch(`${API_URL}/processes/active`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ProcessItem[]) =>
        setProcesses(Array.isArray(data) ? data : [])
      )
      .catch(() => setProcesses([]));
    fetch(`${API_URL}/processes/participants`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ParticipantItem[]) =>
        setParticipants(Array.isArray(data) ? data : [])
      )
      .catch(() => setParticipants([]));
  }, [isOpen, initialCarteira]);

  function toggleProcessId(id: string) {
    setSelectedProcessIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  if (!isOpen) return null;

  const isEdit = !!initialCarteira;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inner}>
          <h2 className={styles.title}>
            {isEdit ? "Editar carteira" : "Nova carteira"}
          </h2>
          <Stepper initialStep={0}>
            <ModalCarteiraContent
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              users={users}
              processes={processes}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              processSearch={processSearch}
              setProcessSearch={setProcessSearch}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              selectedAtendenteIds={selectedAtendenteIds}
              toggleAtendenteId={toggleAtendenteId}
              selectedProcessIds={selectedProcessIds}
              toggleProcessId={toggleProcessId}
              onClose={onClose}
              onCreated={onCreated}
              editingId={initialCarteira?.id ?? null}
              onUpdated={onUpdated}
              participants={participants}
              alumniFilter={alumniFilter}
              setAlumniFilter={setAlumniFilter}
              selectedParticipantIds={selectedParticipantIds}
              toggleParticipantId={toggleParticipantId}
            />
          </Stepper>
        </div>
      </aside>
    </div>
  );
}
