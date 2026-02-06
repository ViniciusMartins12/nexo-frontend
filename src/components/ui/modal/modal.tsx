"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import styles from "./modal.module.scss";
import { Input } from "../input/input";
import { Selected } from "../selected/selected";
import { Button } from "../button/button";
import { Stepper, Step, useStepper } from "./index";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STEPS = ["Dados do processo", "Participantes (CSV)"];

export type ProcessCreated = {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

export type ProcessForEdit = ProcessCreated & {
  guidelines?: string | null;
  edital_url?: string | null;
};

type ParticipantRow = { cpf: string; email: string; name: string };

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
      const rawRows = lines.map((l) =>
        l.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""))
      );
      const header = rawRows[0].map((h) => h.toLowerCase());
      const cpfIdx = header.findIndex((h) => h === "cpf");
      const emailIdx = header.findIndex((h) => h === "email");
      const nameIdx = header.findIndex((h) => h === "nome" || h === "name");
      const hasHeader = cpfIdx >= 0 || emailIdx >= 0 || nameIdx >= 0;
      const start = hasHeader ? 1 : 0;
      const rows: ParticipantRow[] = [];
      for (let i = start; i < rawRows.length; i++) {
        const r = rawRows[i];
        const cpf = (hasHeader && cpfIdx >= 0 ? r[cpfIdx] : r[0]) ?? "";
        const email = (hasHeader && emailIdx >= 0 ? r[emailIdx] : r[1]) ?? "";
        const name = (hasHeader && nameIdx >= 0 ? r[nameIdx] : r[2]) ?? r[1] ?? "";
        if (cpf.replace(/\D/g, "").length === 11) {
          rows.push({ cpf, email, name });
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

  const isEdit = Boolean(initialProcess?.id);
  const currentProcessId = processId ?? initialProcess?.id ?? null;

  useEffect(() => {
    if (isOpen && initialProcess) {
      setName(initialProcess.name ?? "");
      setStartDate(initialProcess.start_date ?? "");
      setEndDate(initialProcess.end_date ?? "");
      setType(initialProcess.type ?? "");
      setGuidelines(initialProcess.guidelines ?? "");
      setEditalUrl(initialProcess.edital_url ?? "");
      setProcessId(initialProcess.id);
    } else if (isOpen && !initialProcess) {
      setName("");
      setStartDate("");
      setEndDate("");
      setType("");
      setGuidelines("");
      setEditalUrl("");
      setProcessId(null);
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
  onClose: () => void;
}) {
  const { currentStep, nextStep, prevStep } = useStepper();

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
          <h2 className={styles.stepTitle}>Lista de participantes</h2>
          <p className={styles.stepDesc}>
            Envie um CSV com as colunas: <strong>cpf</strong>, <strong>email</strong>, <strong>nome</strong>. O CPF deve ter 11 dígitos. Clique em <strong>Enviar lista</strong> para importar; depois em <strong>Concluir</strong> para fechar. Você pode pular esta etapa.
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
                      <th>CPF</th>
                      <th>Email</th>
                      <th>Nome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td>{row.cpf.replace(/\D/g, "").slice(0, 11)}</td>
                        <td>{row.email}</td>
                        <td>{row.name}</td>
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
