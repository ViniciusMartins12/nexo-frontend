"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.scss";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STEP_LABELS = ["Dados pessoais", "Familiares", "Renda", "Documentos"];

type InscricaoData = {
  process: {
    id: string;
    name: string;
    type: string;
    start_date: string;
    end_date: string;
    guidelines: string | null;
    edital_url: string | null;
  };
  application: {
    id: string;
    status: string;
    form_data: Record<string, unknown> | null;
  };
  steps: { step_index: number; name: string; is_done: boolean }[];
  documents: { id: string; documentLabel: string; fileName: string; uploadedAt: string }[];
};

type FormPessoais = {
  telefone?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

type Familiar = {
  nome: string;
  cpf: string;
  parentesco: string;
  data_nascimento?: string;
  renda?: string;
};

type FormRenda = {
  renda_total?: string;
  composicao?: string;
};

export default function CandidatoProcessoInscricaoPage() {
  const params = useParams();
  const processId = params?.id as string;

  const [data, setData] = useState<InscricaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [pessoais, setPessoais] = useState<FormPessoais>({});
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [renda, setRenda] = useState<FormRenda>({});
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!processId) return;
    fetch(`${API_URL}/candidato/processos/${processId}/inscricao`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Processo não encontrado ou sem acesso");
        return res.json();
      })
      .then((d: InscricaoData) => {
        setData(d);
        const fd = d.application?.form_data as Record<string, unknown> | undefined;
        if (fd?.dados_pessoais) setPessoais((fd.dados_pessoais as FormPessoais) || {});
        if (fd?.familiares) setFamiliares((fd.familiares as Familiar[]) || []);
        if (fd?.renda) setRenda((fd.renda as FormRenda) || {});
      })
      .catch(() => setError("Não foi possível carregar o processo."))
      .finally(() => setLoading(false));
  }, [processId]);

  async function saveStep(stepIndex: number, formDataPatch: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/candidato/processos/${processId}/inscricao`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ step_index: stepIndex, form_data: formDataPatch }),
        }
      );
      if (!res.ok) throw new Error("Erro ao salvar");
      if (data) {
        setData((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          next.steps = next.steps.map((s) =>
            s.step_index === stepIndex ? { ...s, is_done: true } : s
          );
          return next;
        });
      }
      if (stepIndex < 3) setCurrentStep(stepIndex + 1);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function handleSavePessoais() {
    saveStep(0, { dados_pessoais: pessoais });
  }

  function handleSaveFamiliares() {
    saveStep(1, { familiares });
  }

  function handleSaveRenda() {
    saveStep(2, { renda });
  }

  async function handleUpload() {
    if (!uploadFile || !uploadLabel.trim()) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("document_label", uploadLabel.trim());
      const res = await fetch(
        `${API_URL}/candidato/processos/${processId}/inscricao/documentos`,
        {
          method: "POST",
          credentials: "include",
          body: form,
        }
      );
      if (!res.ok) throw new Error("Erro ao enviar");
      const doc = await res.json();
      if (data) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                documents: [
                  ...prev.documents,
                  {
                    id: doc.id,
                    documentLabel: doc.document_label,
                    fileName: doc.file_name,
                    uploadedAt: doc.uploaded_at,
                  },
                ],
              }
            : prev
        );
      }
      setUploadLabel("");
      setUploadFile(null);
    } catch {
      setError("Erro ao enviar documento.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <p className={styles.loading}>Carregando...</p>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className={styles.section}>
        <p className={styles.errorMsg}>{error}</p>
        <Link href="/candidato/processos" className={styles.backLink}>
          ← Voltar aos processos
        </Link>
      </section>
    );
  }

  if (!data) return null;

  const { process, steps } = data;

  return (
    <section className={styles.section}>
      <Link href="/candidato/processos" className={styles.backLink}>
        ← Voltar aos processos
      </Link>
      <h1 className={styles.title}>{process.name}</h1>
      <p className={styles.subtitle}>
        Preencha as etapas de cadastro do processo.
      </p>

      <div className={styles.steps}>
        {STEP_LABELS.map((label, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.stepTab} ${currentStep === i ? styles.active : ""} ${steps[i]?.is_done ? styles.done : ""}`}
            onClick={() => setCurrentStep(i)}
          >
            <span className={styles.stepNum}>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {currentStep === 0 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Dados pessoais</h2>
            <p className={styles.formDesc}>
              Complemente seus dados de contato e endereço.
            </p>
            <Input
              label="Telefone"
              value={pessoais.telefone ?? ""}
              onChange={(e) => setPessoais((p) => ({ ...p, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
            />
            <Input
              label="Endereço (rua)"
              value={pessoais.endereco ?? ""}
              onChange={(e) => setPessoais((p) => ({ ...p, endereco: e.target.value }))}
              placeholder="Rua, avenida..."
            />
            <div className={styles.row}>
              <Input
                label="Número"
                value={pessoais.numero ?? ""}
                onChange={(e) => setPessoais((p) => ({ ...p, numero: e.target.value }))}
                placeholder="Nº"
              />
              <Input
                label="Complemento"
                value={pessoais.complemento ?? ""}
                onChange={(e) => setPessoais((p) => ({ ...p, complemento: e.target.value }))}
                placeholder="Apto, bloco..."
              />
            </div>
            <Input
              label="Bairro"
              value={pessoais.bairro ?? ""}
              onChange={(e) => setPessoais((p) => ({ ...p, bairro: e.target.value }))}
              placeholder="Bairro"
            />
            <div className={styles.row}>
              <Input
                label="Cidade"
                value={pessoais.cidade ?? ""}
                onChange={(e) => setPessoais((p) => ({ ...p, cidade: e.target.value }))}
                placeholder="Cidade"
              />
              <Input
                label="Estado"
                value={pessoais.estado ?? ""}
                onChange={(e) => setPessoais((p) => ({ ...p, estado: e.target.value }))}
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <Input
              label="CEP"
              value={pessoais.cep ?? ""}
              onChange={(e) => setPessoais((p) => ({ ...p, cep: e.target.value }))}
              placeholder="00000-000"
            />
            <div className={styles.actions}>
              <Button
                text="Salvar e continuar"
                onClick={handleSavePessoais}
                loading={saving}
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Familiares</h2>
            <p className={styles.formDesc}>
              Informe os membros do seu grupo familiar (quem mora com você).
            </p>
            {familiares.map((f, i) => (
              <div key={i} className={styles.familiarCard}>
                <Input
                  label="Nome"
                  value={f.nome}
                  onChange={(e) =>
                    setFamiliares((prev) => {
                      const n = [...prev];
                      n[i] = { ...n[i], nome: e.target.value };
                      return n;
                    })
                  }
                  placeholder="Nome completo"
                />
                <Input
                  label="CPF"
                  value={f.cpf}
                  onChange={(e) =>
                    setFamiliares((prev) => {
                      const n = [...prev];
                      n[i] = { ...n[i], cpf: e.target.value };
                      return n;
                    })
                  }
                  placeholder="000.000.000-00"
                />
                <Input
                  label="Parentesco"
                  value={f.parentesco}
                  onChange={(e) =>
                    setFamiliares((prev) => {
                      const n = [...prev];
                      n[i] = { ...n[i], parentesco: e.target.value };
                      return n;
                    })
                  }
                  placeholder="Ex.: Cônjuge, Filho(a)"
                />
                <Input
                  label="Data de nascimento"
                  type="date"
                  value={f.data_nascimento ?? ""}
                  onChange={(e) =>
                    setFamiliares((prev) => {
                      const n = [...prev];
                      n[i] = { ...n[i], data_nascimento: e.target.value };
                      return n;
                    })
                  }
                />
                <Input
                  label="Renda (R$)"
                  value={f.renda ?? ""}
                  onChange={(e) =>
                    setFamiliares((prev) => {
                      const n = [...prev];
                      n[i] = { ...n[i], renda: e.target.value };
                      return n;
                    })
                  }
                  placeholder="0,00"
                />
                <Button
                  variant="danger"
                  size="sm"
                  text="Remover"
                  onClick={() =>
                    setFamiliares((prev) => prev.filter((_, j) => j !== i))
                  }
                />
              </div>
            ))}
            <Button
              variant="ghost"
              text="+ Adicionar familiar"
              onClick={() =>
                setFamiliares((prev) => [
                  ...prev,
                  { nome: "", cpf: "", parentesco: "" },
                ])
              }
            />
            <div className={styles.actions}>
              <Button
                text="Salvar e continuar"
                onClick={handleSaveFamiliares}
                loading={saving}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Renda</h2>
            <p className={styles.formDesc}>
              Informe a renda total do grupo familiar.
            </p>
            <Input
              label="Renda total mensal (R$)"
              value={renda.renda_total ?? ""}
              onChange={(e) => setRenda((r) => ({ ...r, renda_total: e.target.value }))}
              placeholder="0,00"
            />
            <label className={styles.label}>Composição da renda (opcional)</label>
            <textarea
              className={styles.textarea}
              value={renda.composicao ?? ""}
              onChange={(e) => setRenda((r) => ({ ...r, composicao: e.target.value }))}
              placeholder="Ex.: Salário, trabalho autônomo, benefícios..."
              rows={3}
            />
            <div className={styles.actions}>
              <Button
                text="Salvar e continuar"
                onClick={handleSaveRenda}
                loading={saving}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Documentos</h2>
            <p className={styles.formDesc}>
              Envie os documentos solicitados pelo processo (RG, CPF, comprovante de renda, etc.).
            </p>
            <div className={styles.uploadBox}>
              <Input
                label="Tipo do documento"
                value={uploadLabel}
                onChange={(e) => setUploadLabel(e.target.value)}
                placeholder="Ex.: RG, CPF, Comprovante de residência"
              />
              <label className={styles.fileLabel}>
                <input
                  type="file"
                  className={styles.fileInput}
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                <span className={styles.fileButton}>
                  {uploadFile ? uploadFile.name : "Escolher arquivo"}
                </span>
              </label>
              <Button
                text="Enviar documento"
                onClick={handleUpload}
                loading={uploading}
                disabled={!uploadFile || !uploadLabel.trim()}
              />
            </div>
            {data.documents.length > 0 && (
              <ul className={styles.docList}>
                <li className={styles.docListTitle}>Documentos enviados:</li>
                {data.documents.map((d) => (
                  <li key={d.id} className={styles.docItem}>
                    <span className={styles.docLabel}>{d.documentLabel}</span>
                    <span className={styles.docName}>{d.fileName}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.actions}>
              <Button
                variant="ghost"
                text="Voltar"
                onClick={() => setCurrentStep(2)}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}
    </section>
  );
}
