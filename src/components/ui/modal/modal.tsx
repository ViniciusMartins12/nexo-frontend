"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import styles from "./modal.module.scss";
import { Input } from "../input/input";
import { Selected } from "../selected/selected";
import { Button } from "../button/button";
import { Stepper, Step, useStepper } from "./index";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STEPS = ["Dados do processo", "Vagas", "Participantes (CSV)"];

export type ProcessCreated = {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

export type VacancyRow = { curso: string; turno: string; quantidade: number; selectedCourseId?: string };

type InstitutionCourseItem = { id: string; code: string; name: string; turno: string; semesters: number; created_at: string };

export type ProcessForEdit = ProcessCreated & {
  guidelines?: string | null;
  edital_url?: string | null;
  vacancies?: VacancyRow[] | null;
};

type ParticipantRow = { cpf: string; email: string; name: string; media_enem?: string; curso?: string; turno?: string };

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (process?: ProcessCreated) => void;
  initialProcess?: ProcessForEdit | null;
  onUpdated?: (process: ProcessCreated) => void;
};

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

/** Parse uma linha CSV respeitando campos entre aspas (ex.: "800,92" é um único campo). */
function parseCsvLine(line: string, sep: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          i++;
          if (line[i] === '"') {
            field += '"';
            i++;
          } else break;
        } else {
          field += line[i];
          i++;
        }
      }
      fields.push(field.trim());
      if (line[i] === sep) i += sep.length;
    } else {
      const end = line.indexOf(sep, i);
      const slice = end === -1 ? line.slice(i) : line.slice(i, end);
      fields.push(slice.trim().replace(/^["']|["']$/g, ""));
      i = end === -1 ? line.length : end + sep.length;
    }
  }
  return fields;
}

function parseCsvPreview(file: File): Promise<ParticipantRow[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string)?.replace(/\r\n/g, "\n").trim() ?? "";
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length === 0) {
        resolve([]);
        return;
      }
      const sep = text.includes(";") ? ";" : ",";
      const rawRows = lines.map((l) => parseCsvLine(l, sep));
      const header = rawRows[0].map((h) => h.toLowerCase().normalize("NFD").replace(/\u0300/g, ""));
      const cpfIdx = header.findIndex((h) => h === "cpf");
      const emailIdx = header.findIndex((h) => h === "email");
      const nameIdx = header.findIndex((h) => h === "nome" || h === "name");
      const mediaEnemIdx = header.findIndex((h) => h === "media enem" || h === "média enem");
      const cursoIdx = header.findIndex((h) => h === "curso");
      const turnoIdx = header.findIndex((h) => h === "turno");
      const hasHeader = cpfIdx >= 0 || emailIdx >= 0 || nameIdx >= 0;
      const start = hasHeader ? 1 : 0;
      const rows: ParticipantRow[] = [];
      for (let i = start; i < rawRows.length; i++) {
        const r = rawRows[i];
        const cpf = (hasHeader && cpfIdx >= 0 ? r[cpfIdx] : r[0]) ?? "";
        const email = (hasHeader && emailIdx >= 0 ? r[emailIdx] : r[1]) ?? "";
        const name = (hasHeader && nameIdx >= 0 ? r[nameIdx] : r[2]) ?? r[1] ?? "";
        const media_enem = (hasHeader && mediaEnemIdx >= 0 ? r[mediaEnemIdx] : r[3]) ?? "";
        const curso = (hasHeader && cursoIdx >= 0 ? r[cursoIdx] : r[4]) ?? "";
        const turno = (hasHeader && turnoIdx >= 0 ? r[turnoIdx] : r[5]) ?? "";
        if (cpf.replace(/\D/g, "").length === 11) {
          rows.push({ cpf, email, name, media_enem, curso, turno });
        }
      }
      resolve(rows);
    };
    reader.readAsText(file, "utf-8");
  });
}

export function Modal({
  isOpen,
  onClose,
  onCreated,
  initialProcess,
  onUpdated,
}: ModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [editalUrl, setEditalUrl] = useState("");
  const [processId, setProcessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<ParticipantRow[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [vacancies, setVacancies] = useState<VacancyRow[]>([]);
  const [institutionCourses, setInstitutionCourses] = useState<InstitutionCourseItem[]>([]);

  const isEdit = Boolean(initialProcess?.id);
  const currentProcessId = processId ?? initialProcess?.id ?? null;

  useEffect(() => {
    if (isOpen && !initialProcess) {
      fetch(`${API_URL}/institution-courses`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : []))
        .then((data: InstitutionCourseItem[]) => setInstitutionCourses(Array.isArray(data) ? data : []))
        .catch(() => setInstitutionCourses([]));
    }
  }, [isOpen, initialProcess]);

  useEffect(() => {
    if (isOpen && initialProcess) {
      setName(initialProcess.name ?? "");
      setStartDate(initialProcess.start_date ?? "");
      setEndDate(initialProcess.end_date ?? "");
      setType(initialProcess.type ?? "");
      setGuidelines(initialProcess.guidelines ?? "");
      setEditalUrl(initialProcess.edital_url ?? "");
      setProcessId(initialProcess.id);
      setVacancies(
        Array.isArray(initialProcess.vacancies) && initialProcess.vacancies.length > 0
          ? initialProcess.vacancies
          : []
      );
    } else if (isOpen && !initialProcess) {
      setName("");
      setStartDate("");
      setEndDate("");
      setType("");
      setGuidelines("");
      setEditalUrl("");
      setProcessId(null);
      setVacancies([]);
    }
    if (isOpen) {
      setErrorMsg(null);
      setCsvFile(null);
      setCsvPreview([]);
      setUploadSuccess(null);
      setUploadError(null);
    }
  }, [isOpen, initialProcess]);

  const canSubmitStep0 =
    name.trim() !== "" &&
    type.trim() !== "" &&
    startDate !== "" &&
    endDate !== "";

  async function handleStep0Next(): Promise<boolean> {
    if (!canSubmitStep0) return false;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isEdit && initialProcess?.id) {
        const res = await fetch(`${API_URL}/processes/${initialProcess.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            type: type.trim(),
            start_date: startDate,
            end_date: endDate,
            guidelines: guidelines.trim() || undefined,
            edital_url: editalUrl.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
          setErrorMsg(msg ?? "Erro ao atualizar processo");
          return false;
        }
        onUpdated?.(data);
        setProcessId(initialProcess.id);
        return true;
      } else {
        const res = await fetch(`${API_URL}/processes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            type: type.trim(),
            start_date: startDate,
            end_date: endDate,
            guidelines: guidelines.trim() || undefined,
            edital_url: editalUrl.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
          setErrorMsg(msg ?? "Erro ao criar processo");
          return false;
        }
        const created = data?.process ?? data;
        const id = created?.id ?? data?.process_id;
        if (id) setProcessId(id);
        onCreated?.(created ?? undefined);
        return true;
      }
    } catch {
      setErrorMsg("Erro de conexão com o servidor");
      return false;
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.menu} onClick={(e) => e.stopPropagation()}>
        <Stepper key={isOpen ? "open" : "closed"} initialStep={0}>
          <ModalContent
            name={name}
            setName={setName}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            type={type}
            setType={setType}
            guidelines={guidelines}
            setGuidelines={setGuidelines}
            editalUrl={editalUrl}
            setEditalUrl={setEditalUrl}
            canSubmitStep0={canSubmitStep0}
            loading={loading}
            errorMsg={errorMsg}
            isEdit={isEdit}
            handleStep0Next={handleStep0Next}
            currentProcessId={currentProcessId}
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            csvPreview={csvPreview}
            setCsvPreview={setCsvPreview}
            uploadLoading={uploadLoading}
            setUploadLoading={setUploadLoading}
            uploadSuccess={uploadSuccess}
            setUploadSuccess={setUploadSuccess}
            uploadError={uploadError}
            setUploadError={setUploadError}
            vacancies={vacancies}
            setVacancies={setVacancies}
            institutionCourses={institutionCourses}
            onClose={onClose}
          />
        </Stepper>
      </aside>
    </div>
  );
}

function ModalContent({
  name,
  setName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  type,
  setType,
  guidelines,
  setGuidelines,
  editalUrl,
  setEditalUrl,
  canSubmitStep0,
  loading,
  errorMsg,
  isEdit,
  handleStep0Next,
  currentProcessId,
  csvFile,
  setCsvFile,
  csvPreview,
  setCsvPreview,
  uploadLoading,
  setUploadLoading,
  uploadSuccess,
  setUploadSuccess,
  uploadError,
  setUploadError,
  vacancies,
  setVacancies,
  institutionCourses,
  onClose,
}: {
  name: string;
  setName: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  guidelines: string;
  setGuidelines: (v: string) => void;
  editalUrl: string;
  setEditalUrl: (v: string) => void;
  canSubmitStep0: boolean;
  loading: boolean;
  errorMsg: string | null;
  isEdit: boolean;
  handleStep0Next: () => Promise<boolean>;
  currentProcessId: string | null;
  csvFile: File | null;
  setCsvFile: (f: File | null) => void;
  csvPreview: ParticipantRow[];
  setCsvPreview: (r: ParticipantRow[]) => void;
  uploadLoading: boolean;
  setUploadLoading: (v: boolean) => void;
  uploadSuccess: string | null;
  setUploadSuccess: (v: string | null) => void;
  uploadError: string | null;
  setUploadError: (v: string | null) => void;
  vacancies: VacancyRow[];
  setVacancies: (v: VacancyRow[] | ((prev: VacancyRow[]) => VacancyRow[])) => void;
  institutionCourses: InstitutionCourseItem[];
  onClose: () => void;
}) {
  const { currentStep, nextStep, prevStep } = useStepper();
  const [vagasLoading, setVagasLoading] = useState(false);
  const hasCourses = institutionCourses.length > 0;
  const TURNOS = [
    { value: "manha", label: "Manhã" },
    { value: "tarde", label: "Tarde" },
    { value: "noite", label: "Noite" },
    { value: "integral", label: "Integral" },
  ];

  function downloadModeloCsv() {
    const headers = ["Nome", "CPF", "Email", "Média ENEM", "Curso", "Turno"];
    const escape = (v: string) => {
      const s = String(v).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    const row = ["Fulano da Silva", "12345678900", "fulano@email.com", "583,92", "Engenharia de Software", "Matutino"];
    const line = (arr: string[]) => arr.map(escape).join(",");
    const csv = "\uFEFF" + line(headers) + "\r\n" + line(row);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-candidatos-autorizados.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setCsvFile(null);
        setCsvPreview([]);
        setUploadError("Selecione um arquivo .csv");
        return;
      }
      setCsvFile(file);
      setUploadSuccess(null);
      setUploadError(null);
      parseCsvPreview(file).then(setCsvPreview);
    },
    [setCsvPreview]
  );

  async function handleUploadCsv() {
    if (!currentProcessId || !csvFile) return;
    setUploadLoading(true);
    setUploadSuccess(null);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", csvFile);
      const res = await fetch(
        `${API_URL}/processes/${currentProcessId}/participants/upload`,
        {
          method: "POST",
          credentials: "include",
          body: form,
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
        setUploadError(msg ?? `Erro ao enviar (${res.status}). Verifique se a tabela process_participants existe no banco.`);
        return;
      }
      const total = data?.total ?? 0;
      setUploadSuccess(`${total} participante(s) importado(s) com sucesso.`);
      setUploadError(null);
      setCsvFile(null);
      setCsvPreview([]);
    } catch {
      setUploadError("Erro de conexão. Tente novamente.");
    } finally {
      setUploadLoading(false);
    }
  }

  return (
    <>
      <StepIndicator current={currentStep} labels={STEPS} />

      <Step step={0}>
        <div className={styles.container}>
          <div className={styles.form}>
            <h1>{isEdit ? "Editar processo" : "Crie seu processo"}</h1>
            {!isEdit && institutionCourses.length === 0 && (
              <div className={styles.coursesWarning} role="alert">
                Adicione os cursos da instituição em <strong>Cursos</strong> antes de criar um processo, para definir vagas por curso e turno.
              </div>
            )}
            <Input
              label="Nome do processo"
              variant="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={500}
            />
            <Input
              label="Data de início"
              variant="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="Data de término"
              variant="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
            <Selected
              label="Tipo de processo"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: "manutencao", label: "Manutenção de bolsas" },
                { value: "novo", label: "Novo Processo" },
              ]}
            />
            <div className={styles.wrapperTextarea}>
              <label className={styles.label}>Diretrizes (opcional)</label>
              <textarea
                className={styles.textarea}
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
                placeholder="Texto das diretrizes do processo"
                rows={3}
                maxLength={10000}
              />
            </div>
            <Input
              label="URL do edital (opcional)"
              variant="text"
              value={editalUrl}
              onChange={(e) => setEditalUrl(e.target.value)}
              placeholder="https://..."
            />
            {errorMsg && <p className={styles.error}>{errorMsg}</p>}
          </div>
          <div className={styles.illustration}>
            <Image
              src="/svg/process-ilust.svg"
              alt="Nexo"
              width={500}
              height={500}
            />
          </div>
        </div>
        <div className={styles.buttons}>
          <Button
            text={isEdit ? "Próximo" : "Criar e continuar"}
            onClick={async () => {
              const ok = await handleStep0Next();
              if (ok) nextStep();
            }}
            loading={loading}
            disabled={!canSubmitStep0}
          />
        </div>
      </Step>

      <Step step={1}>
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Vagas por curso e turno</h2>
          <p className={styles.stepDesc}>
            Defina a quantidade de vagas para cada combinação de curso e turno. Você pode pular ou adicionar depois.
          </p>
          {hasCourses ? (
            <div className={styles.vagasList}>
              {vacancies.map((row, idx) => {
                const matchedCourseId = row.selectedCourseId ?? institutionCourses.find((c) => c.name === row.curso && c.turno === row.turno)?.id ?? "";
                return (
                  <div key={idx} className={`${styles.vagaRow} ${styles.vagaRowCourse}`}>
                    <div className={styles.selectWrap}>
                      <label className={styles.label}>Curso</label>
                      <select
                        className={styles.select}
                        value={matchedCourseId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const course = institutionCourses.find((c) => c.id === id);
                          if (!course) return;
                          setVacancies((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], selectedCourseId: course.id, curso: course.name, turno: course.turno };
                            return next;
                          });
                        }}
                      >
                        <option value="">Selecione o curso</option>
                        {institutionCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} – {c.name} ({c.turno})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Quantidade"
                      variant="number"
                      min={0}
                      value={row.quantidade > 0 ? String(row.quantidade) : ""}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setVacancies((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], quantidade: Number.isFinite(n) && n >= 0 ? n : 0 };
                          return next;
                        });
                      }}
                      placeholder="0"
                    />
                    <button
                      type="button"
                      className={styles.removeVaga}
                      onClick={() => setVacancies((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remover linha"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
              <Button
                variant="ghost"
                text="+ Adicionar vaga"
                onClick={() =>
                  setVacancies((prev) => [...prev, { curso: "", turno: "manha", quantidade: 0 }])
                }
              />
            </div>
          ) : (
            <div className={styles.vagasList}>
              {vacancies.map((row, idx) => (
                <div key={idx} className={styles.vagaRow}>
                  <Input
                    label="Curso"
                    variant="text"
                    value={row.curso}
                    onChange={(e) =>
                      setVacancies((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], curso: e.target.value };
                        return next;
                      })
                    }
                    placeholder="Ex.: Engenharia de Software"
                  />
                  <Selected
                    label="Turno"
                    value={row.turno}
                    onChange={(e) =>
                      setVacancies((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], turno: e.target.value };
                        return next;
                      })
                    }
                    options={TURNOS}
                  />
                  <Input
                    label="Quantidade"
                    variant="number"
                    min={0}
                    value={row.quantidade > 0 ? String(row.quantidade) : ""}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setVacancies((prev) => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], quantidade: Number.isFinite(n) && n >= 0 ? n : 0 };
                        return next;
                      });
                    }}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    className={styles.removeVaga}
                    onClick={() => setVacancies((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remover linha"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                text="+ Adicionar vaga"
                onClick={() =>
                  setVacancies((prev) => [...prev, { curso: "", turno: "manha", quantidade: 0 }])
                }
              />
            </div>
          )}
          <div className={styles.buttons}>
            <Button variant="ghost" text="Voltar" onClick={prevStep} />
            <Button
              text="Próximo"
              loading={vagasLoading}
              onClick={async () => {
                if (!currentProcessId) {
                  setUploadError("Processo não identificado. Volte ao passo anterior e clique em \"Criar e continuar\" novamente.");
                  return;
                }
                setVagasLoading(true);
                setUploadError(null);
                try {
                  const payload = vacancies
                    .filter((v) => v.curso.trim() !== "" && v.quantidade > 0)
                    .map((v) => ({ curso: v.curso.trim(), turno: v.turno, quantidade: v.quantidade }));
                  const res = await fetch(`${API_URL}/processes/${currentProcessId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ vacancies: payload }),
                  });
                  if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    const msg = errData?.message ?? (Array.isArray(errData.message) ? errData.message.join(" ") : "Erro ao salvar vagas");
                    throw new Error(msg);
                  }
                  nextStep();
                } catch (e) {
                  setUploadError(e instanceof Error ? e.message : "Erro ao salvar vagas. Tente novamente.");
                } finally {
                  setVagasLoading(false);
                }
              }}
            />
          </div>
          {uploadError && currentStep === 1 && (
            <p className={styles.error}>{uploadError}</p>
          )}
        </div>
      </Step>

      <Step step={2}>
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Lista de participantes</h2>
          <p className={styles.stepDesc}>
            Envie um CSV no formato: <strong>Nome</strong>, <strong>CPF</strong>, <strong>Email</strong>, <strong>Média ENEM</strong>, <strong>Curso</strong>, <strong>Turno</strong>. Apenas Nome, CPF e Email são obrigatórios para importar. O CPF deve ter 11 dígitos. Você pode <button type="button" className={styles.linkButton} onClick={downloadModeloCsv}>baixar o modelo CSV</button> e depois <strong>Enviar lista</strong>; em seguida <strong>Concluir</strong> para fechar. Esta etapa é opcional.
          </p>
          <div className={styles.fileWrap}>
            <input
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className={styles.fileInput}
            />
            {csvFile && (
              <span className={styles.fileName}>{csvFile.name}</span>
            )}
          </div>
          {csvPreview.length > 0 && (
            <div className={styles.previewWrap}>
              <p className={styles.previewTitle}>
                Preview ({csvPreview.length} linha(s))
              </p>
              <div className={styles.previewTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Email</th>
                      <th>Média ENEM</th>
                      <th>Curso</th>
                      <th>Turno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td>{row.name}</td>
                        <td>{row.cpf.replace(/\D/g, "").slice(0, 11)}</td>
                        <td>{row.email}</td>
                        <td>{row.media_enem ?? ""}</td>
                        <td>{row.curso ?? ""}</td>
                        <td>{row.turno ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvPreview.length > 10 && (
                  <p className={styles.previewMore}>
                    … e mais {csvPreview.length - 10} linha(s)
                  </p>
                )}
              </div>
            </div>
          )}
          {uploadSuccess && (
            <p className={styles.success}>{uploadSuccess}</p>
          )}
          {uploadError && (
            <p className={styles.error}>{uploadError}</p>
          )}
          <div className={styles.buttons}>
            <Button variant="ghost" text="Voltar" onClick={prevStep} />
            <Button
              text="Enviar lista"
              onClick={handleUploadCsv}
              loading={uploadLoading}
              disabled={!csvFile}
            />
            <Button text="Concluir" onClick={onClose} />
          </div>
        </div>
      </Step>
    </>
  );
}
