"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.scss";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";
import { SilviaRagWidget } from "@/components/silvia-rag/SilviaRagWidget";
import { DOCUMENT_CHECKLIST } from "./documentChecklist";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const DOC_LABEL_PREFIX = "DOC"; // prefixo para match: DOC|candidato|1.1|label

// Tipos das seções
type DadosPessoais = {
  curso?: string;
  turno?: "manha" | "tarde" | "noite" | "integral";
  nome_civil_social?: string;
  idade?: number | "";
  genero?: string;
  rg?: string;
  estado_civil?: string;
  email_candidato?: string;
  menor_18?: boolean;
  nome_responsavel?: string;
  grau_parentesco_responsavel?: string;
  contato_responsavel?: string;
};

type EnderecoFamilia = {
  endereco_completo?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  ponto_referencia?: string;
};

type EnsinoMedio = {
  tipo_rede?: "integral_publica" | "integral_privada" | "parte_publica_privada";
};

type MembroFamiliar = {
  nome_completo: string;
  grau_parentesco: string;
  idade: number | "";
  escolaridade: string;
};

type DadosFamilia = {
  membros: MembroFamiliar[];
  dois_genitores_no_grupo?: boolean;
  irmaos_fora_residencia?: boolean;
};

type MembroRenda = {
  primeiro_nome: string;
  fonte_renda: string;
  renda_bruta_mensal: number | "";
};

type RendaFamiliar = {
  membros: MembroRenda[];
};

type BemImovel = {
  tipo: "casa" | "apartamento" | "terreno";
  valor_comercial: number | "";
};

type PatrimonioImoveis = {
  moradia?: "proprio_quitado" | "financiado" | "alugado" | "cedido";
  valor_parcela?: number | "";
  parcelas_restantes?: number | "";
  valor_aluguel?: number | "";
  bens: BemImovel[];
};

type BemMovel = {
  tipo: string;
  marca_modelo_ano: string;
  valor_fipe: number | "";
  financiado?: boolean;
  valor_parcela?: number | "";
  parcelas_restantes?: number | "";
};

type PatrimonioMoveis = {
  bens: BemMovel[];
};

type OutrosPatrimonios = {
  dinheiro_especie?: number | "";
  poupanca?: number | "";
  aplicacoes?: number | "";
  previdencia_privada?: number | "";
  consorcios?: number | "";
  patrimonio_rural?: number | "";
};

type Declaracoes = {
  veracidade?: boolean;
  ciencia_omissao_falsidade?: boolean;
  aceite_termos?: boolean;
};

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

const TURNOS = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "integral", label: "Integral" },
] as const;

const ESTADO_CIVIL = [
  "Solteiro(a)",
  "Casado(a)",
  "União estável",
  "Viúvo(a)",
  "Divorciado(a)",
];

const GENEROS = ["Feminino", "Masculino", "Não binário", "Outro", "Prefiro não informar"];

const ENSINO_MEDIO_OPCOES = [
  { value: "integral_publica", label: "Integralmente em rede pública" },
  { value: "integral_privada", label: "Integralmente em rede privada" },
  { value: "parte_publica_privada", label: "Parte em rede pública e parte em rede privada" },
];

const ESCOLARIDADES = [
  "Fundamental incompleto",
  "Fundamental completo",
  "Médio incompleto",
  "Médio completo",
  "Superior incompleto",
  "Superior completo",
  "Pós-graduação",
  "Não alfabetizado",
];

function parseNum(v: unknown): number | "" {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

export default function CandidatoProcessoInscricaoPage() {
  const params = useParams();
  const processId = params?.id as string;

  const [data, setData] = useState<InscricaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [dadosPessoais, setDadosPessoais] = useState<DadosPessoais>({});
  const [enderecoFamilia, setEnderecoFamilia] = useState<EnderecoFamilia>({});
  const [ensinoMedio, setEnsinoMedio] = useState<EnsinoMedio>({});
  const [dadosFamilia, setDadosFamilia] = useState<DadosFamilia>({ membros: [] });
  const [rendaFamiliar, setRendaFamiliar] = useState<RendaFamiliar>({ membros: [] });
  const [patrimonioImoveis, setPatrimonioImoveis] = useState<PatrimonioImoveis>({ bens: [] });
  const [patrimonioMoveis, setPatrimonioMoveis] = useState<PatrimonioMoveis>({ bens: [] });
  const [outrosPatrimonios, setOutrosPatrimonios] = useState<OutrosPatrimonios>({});
  const [declaracoes, setDeclaracoes] = useState<Declaracoes>({});
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hiddenDocItems, setHiddenDocItems] = useState<Set<string>>(new Set());
  const [viewerDocument, setViewerDocument] = useState<{ id: string; fileName: string } | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerDownloadUrl, setViewerDownloadUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [replacingRow, setReplacingRow] = useState<{
    docId: string;
    familiarKey: string;
    itemId: string;
    itemLabel: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  function inferMimeType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    return "application/octet-stream";
  }

  useEffect(() => {
    if (!viewerDocument || !processId) {
      setViewerUrl(null);
      setViewerDownloadUrl(null);
      return;
    }
    let disposed = false;
    setViewerUrl(null);
    setViewerDownloadUrl(null);
    setViewerLoading(true);
    fetch(
      `${API_URL}/candidato/processos/${processId}/inscricao/documentos/${viewerDocument.id}/url`,
      { credentials: "include" }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Link não disponível");
        return res.json();
      })
      .then(async (body: { url: string }) => {
        if (disposed) return;
        setViewerDownloadUrl(body.url);

        const fileRes = await fetch(body.url);
        if (!fileRes.ok) throw new Error("Arquivo indisponível");
        const arrayBuffer = await fileRes.arrayBuffer();
        const blob = new Blob([arrayBuffer], {
          type: inferMimeType(viewerDocument.fileName),
        });
        const objectUrl = URL.createObjectURL(blob);
        if (disposed) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setViewerUrl(objectUrl);
      })
      .catch(() => setError("Não foi possível abrir o documento."))
      .finally(() => setViewerLoading(false));
    return () => {
      disposed = true;
    };
  }, [viewerDocument?.id, processId]);

  useEffect(() => {
    return () => {
      if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    };
  }, [viewerUrl]);

  useEffect(() => {
    if (!processId) return;
    fetch(`${API_URL}/candidato/processos/${processId}/inscricao`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Processo não encontrado ou sem acesso");
        return res.json();
      })
      .then((d: InscricaoData) => {
        setData(d);
        const fd = d.application?.form_data as Record<string, unknown> | undefined;
        if (fd?.dados_pessoais) setDadosPessoais((fd.dados_pessoais as DadosPessoais) || {});
        if (fd?.endereco_familia) setEnderecoFamilia((fd.endereco_familia as EnderecoFamilia) || {});
        if (fd?.ensino_medio) setEnsinoMedio((fd.ensino_medio as EnsinoMedio) || {});
        if (fd?.dados_familia) setDadosFamilia((fd.dados_familia as DadosFamilia) || { membros: [] });
        if (fd?.renda_familiar) setRendaFamiliar((fd.renda_familiar as RendaFamiliar) || { membros: [] });
        if (fd?.patrimonio_imoveis) setPatrimonioImoveis((fd.patrimonio_imoveis as PatrimonioImoveis) || { bens: [] });
        if (fd?.patrimonio_moveis) setPatrimonioMoveis((fd.patrimonio_moveis as PatrimonioMoveis) || { bens: [] });
        if (fd?.outros_patrimonios) setOutrosPatrimonios((fd.outros_patrimonios as OutrosPatrimonios) || {});
        if (fd?.declaracoes) setDeclaracoes((fd.declaracoes as Declaracoes) || {});
        if (Array.isArray(fd?.documents_hidden)) {
          setHiddenDocItems(new Set(fd.documents_hidden as string[]));
        }
      })
      .catch(() => setError("Não foi possível carregar o processo."))
      .finally(() => setLoading(false));
  }, [processId]);

  async function saveStep(stepIndex: number, formDataPatch: Record<string, unknown>) {
    setSaving(true);
    setError(null);
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
      if (stepIndex < 9) setCurrentStep(stepIndex + 1);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadLabel.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("document_label", uploadLabel.trim());
      const res = await fetch(
        `${API_URL}/candidato/processos/${processId}/inscricao/documentos`,
        { method: "POST", credentials: "include", body: form }
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Erro ao enviar documento.");
    } finally {
      setUploading(false);
    }
  }

  function buildDocLabel(familiarKey: string, itemId: string, itemLabel: string) {
    return `${familiarKey}|${itemId}|${itemLabel.slice(0, 120)}`;
  }

  function getDocForRow(familiarKey: string, itemId: string) {
    if (!data) return null;
    const prefix = `${familiarKey}|${itemId}|`;
    return data.documents.find((d) => d.documentLabel.startsWith(prefix)) ?? null;
  }

  async function handleUploadForRow(
    file: File,
    familiarKey: string,
    itemId: string,
    itemLabel: string,
    replaceDocId?: string | null
  ) {
    const label = buildDocLabel(familiarKey, itemId, itemLabel);
    setUploadFile(file);
    setUploadLabel(label);
    setUploading(true);
    setError(null);
    try {
      if (replaceDocId && processId) {
        const deleteUrl = `${API_URL}/candidato/processos/${processId}/inscricao/documentos/${replaceDocId}`;
        const delRes = await fetch(deleteUrl, { method: "DELETE", credentials: "include" });
        if (!delRes.ok) throw new Error("Erro ao remover documento anterior.");
        if (data) {
          setData((prev) =>
            prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== replaceDocId) } : prev
          );
        }
      }
      const form = new FormData();
      form.append("file", file);
      form.append("document_label", label);
      const res = await fetch(
        `${API_URL}/candidato/processos/${processId}/inscricao/documentos`,
        { method: "POST", credentials: "include", body: form }
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
        setViewerDocument({ id: doc.id, fileName: doc.file_name });
      }
      setReplacingRow(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    } catch {
      setError("Erro ao enviar documento.");
    } finally {
      setUploading(false);
    }
  }

  function toggleDocItemHidden(familiarKey: string, itemId: string) {
    const key = `${familiarKey}-${itemId}`;
    setHiddenDocItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      const arr = Array.from(next);
      fetch(
        `${API_URL}/candidato/processos/${processId}/inscricao`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ step_index: 9, form_data: { documents_hidden: arr } }),
        }
      ).catch(() => {});
      return next;
    });
  }

  const somaRenda = rendaFamiliar.membros.reduce(
    (acc, m) => acc + (typeof m.renda_bruta_mensal === "number" ? m.renda_bruta_mensal : 0),
    0
  );
  const numMembrosRenda = rendaFamiliar.membros.length || 1;
  const rendaPerCapita = numMembrosRenda > 0 ? somaRenda / numMembrosRenda : 0;

  const totalImoveis = patrimonioImoveis.bens.reduce(
    (acc, b) => acc + (typeof b.valor_comercial === "number" ? b.valor_comercial : 0),
    0
  );
  const totalMoveis = patrimonioMoveis.bens.reduce(
    (acc, b) => acc + (typeof b.valor_fipe === "number" ? b.valor_fipe : 0),
    0
  );
  const totalOutros =
    (typeof outrosPatrimonios.dinheiro_especie === "number" ? outrosPatrimonios.dinheiro_especie : 0) +
    (typeof outrosPatrimonios.poupanca === "number" ? outrosPatrimonios.poupanca : 0) +
    (typeof outrosPatrimonios.aplicacoes === "number" ? outrosPatrimonios.aplicacoes : 0) +
    (typeof outrosPatrimonios.previdencia_privada === "number" ? outrosPatrimonios.previdencia_privada : 0) +
    (typeof outrosPatrimonios.consorcios === "number" ? outrosPatrimonios.consorcios : 0) +
    (typeof outrosPatrimonios.patrimonio_rural === "number" ? outrosPatrimonios.patrimonio_rural : 0);

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
        Preencha as etapas do formulário de inscrição.
      </p>

      <div className={styles.steps}>
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.stepTab} ${currentStep === i ? styles.active : ""} ${s.is_done ? styles.done : ""}`}
            onClick={() => setCurrentStep(i)}
          >
            <span className={styles.stepNum}>{i + 1}</span>
            {s.name}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {/* SEÇÃO 1 – DADOS PESSOAIS */}
        {currentStep === 0 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Dados pessoais do candidato</h2>
            <p className={styles.formDesc}>
              Preencha seus dados pessoais.
            </p>
            <Input
              label="Curso"
              value={dadosPessoais.curso ?? ""}
              onChange={(e) => setDadosPessoais((p) => ({ ...p, curso: e.target.value }))}
              placeholder="Ex.: Administração"
            />
            <div className={styles.field}>
              <span className={styles.label}>Turno</span>
              <select
                className={styles.select}
                value={dadosPessoais.turno ?? ""}
                onChange={(e) => setDadosPessoais((p) => ({ ...p, turno: e.target.value as DadosPessoais["turno"] }))}
              >
                <option value="">Selecione</option>
                {TURNOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Nome civil/social"
              value={dadosPessoais.nome_civil_social ?? ""}
              onChange={(e) => setDadosPessoais((p) => ({ ...p, nome_civil_social: e.target.value }))}
              placeholder="Nome completo"
            />
            <Input
              label="Idade"
              variant="number"
              min={1}
              max={120}
              value={dadosPessoais.idade === "" ? "" : dadosPessoais.idade}
              onChange={(e) => setDadosPessoais((p) => ({ ...p, idade: parseNum(e.target.value) }))}
              placeholder="Anos"
            />
            <div className={styles.field}>
              <span className={styles.label}>Gênero</span>
              <select
                className={styles.select}
                value={dadosPessoais.genero ?? ""}
                onChange={(e) => setDadosPessoais((p) => ({ ...p, genero: e.target.value }))}
              >
                <option value="">Selecione</option>
                {GENEROS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <Input
              label="RG"
              value={dadosPessoais.rg ?? ""}
              onChange={(e) => setDadosPessoais((p) => ({ ...p, rg: e.target.value }))}
              placeholder="Número do RG"
            />
            <div className={styles.field}>
              <span className={styles.label}>Estado civil</span>
              <select
                className={styles.select}
                value={dadosPessoais.estado_civil ?? ""}
                onChange={(e) => setDadosPessoais((p) => ({ ...p, estado_civil: e.target.value }))}
              >
                <option value="">Selecione</option>
                {ESTADO_CIVIL.map((ec) => (
                  <option key={ec} value={ec}>{ec}</option>
                ))}
              </select>
            </div>
            <Input
              label="E-mail do candidato"
              variant="email"
              value={dadosPessoais.email_candidato ?? ""}
              onChange={(e) => setDadosPessoais((p) => ({ ...p, email_candidato: e.target.value }))}
              placeholder="seu@email.com"
            />
            <div className={styles.field}>
              <span className={styles.label}>O candidato é menor de 18 anos?</span>
              <select
                className={styles.select}
                value={dadosPessoais.menor_18 === true ? "sim" : dadosPessoais.menor_18 === false ? "nao" : ""}
                onChange={(e) => setDadosPessoais((p) => ({ ...p, menor_18: e.target.value === "sim" }))}
              >
                <option value="">Selecione</option>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>
            {dadosPessoais.menor_18 && (
              <>
                <Input
                  label="Nome do responsável legal"
                  value={dadosPessoais.nome_responsavel ?? ""}
                  onChange={(e) => setDadosPessoais((p) => ({ ...p, nome_responsavel: e.target.value }))}
                />
                <Input
                  label="Grau de parentesco"
                  value={dadosPessoais.grau_parentesco_responsavel ?? ""}
                  onChange={(e) => setDadosPessoais((p) => ({ ...p, grau_parentesco_responsavel: e.target.value }))}
                  placeholder="Ex.: Pai, Mãe, Tutor"
                />
                <Input
                  label="Contato do responsável"
                  value={dadosPessoais.contato_responsavel ?? ""}
                  onChange={(e) => setDadosPessoais((p) => ({ ...p, contato_responsavel: e.target.value }))}
                  placeholder="Telefone ou e-mail"
                />
              </>
            )}
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(0, { dados_pessoais: dadosPessoais })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 2 – ENDEREÇO DA FAMÍLIA */}
        {currentStep === 1 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Endereço da família</h2>
            <p className={styles.formDesc}>
              Informe o endereço do grupo familiar.
            </p>
            <Input
              label="Endereço completo"
              value={enderecoFamilia.endereco_completo ?? ""}
              onChange={(e) => setEnderecoFamilia((p) => ({ ...p, endereco_completo: e.target.value }))}
              placeholder="Rua, número..."
            />
            <Input
              label="Complemento (apto, bloco, condomínio etc.)"
              value={enderecoFamilia.complemento ?? ""}
              onChange={(e) => setEnderecoFamilia((p) => ({ ...p, complemento: e.target.value }))}
              placeholder="Apto, bloco..."
            />
            <Input
              label="Bairro"
              value={enderecoFamilia.bairro ?? ""}
              onChange={(e) => setEnderecoFamilia((p) => ({ ...p, bairro: e.target.value }))}
            />
            <Input
              label="CEP"
              value={enderecoFamilia.cep ?? ""}
              onChange={(e) => setEnderecoFamilia((p) => ({ ...p, cep: e.target.value }))}
              placeholder="00000-000"
            />
            <Input
              label="Ponto de referência / zona rural / região"
              value={enderecoFamilia.ponto_referencia ?? ""}
              onChange={(e) => setEnderecoFamilia((p) => ({ ...p, ponto_referencia: e.target.value }))}
              placeholder="Referência para localização"
            />
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(1, { endereco_familia: enderecoFamilia })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 3 – ENSINO MÉDIO */}
        {currentStep === 2 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Dados curriculares – Ensino médio</h2>
            <p className={styles.formDesc}>
              Onde você cursou o ensino médio?
            </p>
            <div className={styles.field}>
              <span className={styles.label}>Tipo de rede</span>
              <select
                className={styles.select}
                value={ensinoMedio.tipo_rede ?? ""}
                onChange={(e) => setEnsinoMedio((p) => ({ ...p, tipo_rede: e.target.value as EnsinoMedio["tipo_rede"] }))}
              >
                <option value="">Selecione</option>
                {ENSINO_MEDIO_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(2, { ensino_medio: ensinoMedio })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 4 – DADOS DA FAMÍLIA */}
        {currentStep === 3 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Dados curriculares da família</h2>
            <p className={styles.formDesc}>
              Inclua os membros do grupo familiar (nome, parentesco, idade, escolaridade).
            </p>
            {(dadosFamilia.membros || []).map((m, i) => (
              <div key={i} className={styles.familiarCard}>
                <Input
                  label="Nome completo"
                  value={m.nome_completo}
                  onChange={(e) =>
                    setDadosFamilia((prev) => {
                      const n = { ...prev, membros: [...(prev.membros || [])] };
                      n.membros[i] = { ...n.membros[i], nome_completo: e.target.value };
                      return n;
                    })
                  }
                />
                <Input
                  label="Grau de parentesco"
                  value={m.grau_parentesco}
                  onChange={(e) =>
                    setDadosFamilia((prev) => {
                      const n = { ...prev, membros: [...(prev.membros || [])] };
                      n.membros[i] = { ...n.membros[i], grau_parentesco: e.target.value };
                      return n;
                    })
                  }
                  placeholder="Ex.: Pai, Mãe, Filho(a)"
                />
                <Input
                  label="Idade"
                  variant="number"
                  min={0}
                  value={m.idade === "" ? "" : m.idade}
                  onChange={(e) =>
                    setDadosFamilia((prev) => {
                      const n = { ...prev, membros: [...(prev.membros || [])] };
                      n.membros[i] = { ...n.membros[i], idade: parseNum(e.target.value) };
                      return n;
                    })
                  }
                />
                <div className={styles.field}>
                  <span className={styles.label}>Escolaridade</span>
                  <select
                    className={styles.select}
                    value={m.escolaridade}
                    onChange={(e) =>
                      setDadosFamilia((prev) => {
                        const n = { ...prev, membros: [...(prev.membros || [])] };
                        n.membros[i] = { ...n.membros[i], escolaridade: e.target.value };
                        return n;
                      })
                    }
                  >
                    <option value="">Selecione</option>
                    {ESCOLARIDADES.map((esc) => (
                      <option key={esc} value={esc}>{esc}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  text="Remover"
                  onClick={() =>
                    setDadosFamilia((prev) => ({
                      ...prev,
                      membros: prev.membros.filter((_, j) => j !== i),
                    }))
                  }
                />
              </div>
            ))}
            <Button
              variant="ghost"
              text="+ Adicionar membro"
              onClick={() =>
                setDadosFamilia((prev) => ({
                  ...prev,
                  membros: [...(prev.membros || []), { nome_completo: "", grau_parentesco: "", idade: "", escolaridade: "" }],
                }))
              }
            />
            <div className={styles.field}>
              <span className={styles.label}>Os dois genitores fazem parte do grupo familiar?</span>
              <select
                className={styles.select}
                value={dadosFamilia.dois_genitores_no_grupo === true ? "sim" : dadosFamilia.dois_genitores_no_grupo === false ? "nao" : ""}
                onChange={(e) => setDadosFamilia((p) => ({ ...p, dois_genitores_no_grupo: e.target.value === "sim" }))}
              >
                <option value="">Selecione</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Há irmãos que não residem com o grupo familiar?</span>
              <select
                className={styles.select}
                value={dadosFamilia.irmaos_fora_residencia === true ? "sim" : dadosFamilia.irmaos_fora_residencia === false ? "nao" : ""}
                onChange={(e) => setDadosFamilia((p) => ({ ...p, irmaos_fora_residencia: e.target.value === "sim" }))}
              >
                <option value="">Selecione</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(3, { dados_familia: dadosFamilia })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 5 – RENDA FAMILIAR */}
        {currentStep === 4 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Informações financeiras</h2>
            <p className={styles.formDesc}>
              Tabela de renda familiar por membro.
            </p>
            {(rendaFamiliar.membros || []).map((m, i) => (
              <div key={i} className={styles.familiarCard}>
                <Input
                  label="Primeiro nome"
                  value={m.primeiro_nome}
                  onChange={(e) =>
                    setRendaFamiliar((prev) => {
                      const n = { ...prev, membros: [...(prev.membros || [])] };
                      n.membros[i] = { ...n.membros[i], primeiro_nome: e.target.value };
                      return n;
                    })
                  }
                />
                <Input
                  label="Fonte de renda"
                  value={m.fonte_renda}
                  onChange={(e) =>
                    setRendaFamiliar((prev) => {
                      const n = { ...prev, membros: [...(prev.membros || [])] };
                      n.membros[i] = { ...n.membros[i], fonte_renda: e.target.value };
                      return n;
                    })
                  }
                  placeholder="Ex.: Salário, trabalho autônomo"
                />
                <Input
                  label="Renda bruta mensal (R$)"
                  variant="number"
                  min={0}
                  step={0.01}
                  value={m.renda_bruta_mensal === "" ? "" : m.renda_bruta_mensal}
                  onChange={(e) =>
                    setRendaFamiliar((prev) => {
                      const n = { ...prev, membros: [...(prev.membros || [])] };
                      n.membros[i] = { ...n.membros[i], renda_bruta_mensal: parseNum(e.target.value) };
                      return n;
                    })
                  }
                />
                <Button
                  variant="danger"
                  size="sm"
                  text="Remover"
                  onClick={() =>
                    setRendaFamiliar((prev) => ({
                      ...prev,
                      membros: prev.membros.filter((_, j) => j !== i),
                    }))
                  }
                />
              </div>
            ))}
            <Button
              variant="ghost"
              text="+ Adicionar membro"
              onClick={() =>
                setRendaFamiliar((prev) => ({
                  ...prev,
                  membros: [...(prev.membros || []), { primeiro_nome: "", fonte_renda: "", renda_bruta_mensal: "" }],
                }))
              }
            />
            <div className={styles.calcBox}>
              <p><strong>Soma da renda bruta familiar:</strong> R$ {somaRenda.toFixed(2)}</p>
              <p><strong>Número de membros:</strong> {numMembrosRenda}</p>
              <p><strong>Renda per capita:</strong> R$ {rendaPerCapita.toFixed(2)}</p>
            </div>
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(4, { renda_familiar: rendaFamiliar })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 6 – BENS IMÓVEIS */}
        {currentStep === 5 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Patrimônio – Bens imóveis</h2>
            <p className={styles.formDesc}>
              Imóvel de moradia e outros bens imóveis.
            </p>
            <div className={styles.field}>
              <span className={styles.label}>O imóvel de moradia do grupo familiar é:</span>
              <select
                className={styles.select}
                value={patrimonioImoveis.moradia ?? ""}
                onChange={(e) => setPatrimonioImoveis((p) => ({ ...p, moradia: e.target.value as PatrimonioImoveis["moradia"] }))}
              >
                <option value="">Selecione</option>
                <option value="proprio_quitado">Próprio quitado</option>
                <option value="financiado">Financiado</option>
                <option value="alugado">Alugado</option>
                <option value="cedido">Cedido</option>
              </select>
            </div>
            {patrimonioImoveis.moradia === "financiado" && (
              <>
                <Input
                  label="Valor da parcela (R$)"
                  variant="number"
                  min={0}
                  step={0.01}
                  value={patrimonioImoveis.valor_parcela === "" ? "" : patrimonioImoveis.valor_parcela}
                  onChange={(e) => setPatrimonioImoveis((p) => ({ ...p, valor_parcela: parseNum(e.target.value) }))}
                />
                <Input
                  label="Número de parcelas restantes"
                  variant="number"
                  min={0}
                  value={patrimonioImoveis.parcelas_restantes === "" ? "" : patrimonioImoveis.parcelas_restantes}
                  onChange={(e) => setPatrimonioImoveis((p) => ({ ...p, parcelas_restantes: parseNum(e.target.value) }))}
                />
              </>
            )}
            {patrimonioImoveis.moradia === "alugado" && (
              <Input
                label="Valor mensal do aluguel (R$)"
                variant="number"
                min={0}
                step={0.01}
                value={patrimonioImoveis.valor_aluguel === "" ? "" : patrimonioImoveis.valor_aluguel}
                onChange={(e) => setPatrimonioImoveis((p) => ({ ...p, valor_aluguel: parseNum(e.target.value) }))}
              />
            )}
            <p className={styles.label}>Tabela de bens imóveis</p>
            {(patrimonioImoveis.bens || []).map((b, i) => (
              <div key={i} className={styles.familiarCard}>
                <div className={styles.field}>
                  <span className={styles.label}>Tipo</span>
                  <select
                    className={styles.select}
                    value={b.tipo}
                    onChange={(e) =>
                      setPatrimonioImoveis((prev) => {
                        const n = { ...prev, bens: [...(prev.bens || [])] };
                        n.bens[i] = { ...n.bens[i], tipo: e.target.value as BemImovel["tipo"] };
                        return n;
                      })
                    }
                  >
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                  </select>
                </div>
                <Input
                  label="Valor comercial (R$)"
                  variant="number"
                  min={0}
                  step={0.01}
                  value={b.valor_comercial === "" ? "" : b.valor_comercial}
                  onChange={(e) =>
                    setPatrimonioImoveis((prev) => {
                      const n = { ...prev, bens: [...(prev.bens || [])] };
                      n.bens[i] = { ...n.bens[i], valor_comercial: parseNum(e.target.value) };
                      return n;
                    })
                  }
                />
                <Button
                  variant="danger"
                  size="sm"
                  text="Remover"
                  onClick={() =>
                    setPatrimonioImoveis((prev) => ({
                      ...prev,
                      bens: prev.bens.filter((_, j) => j !== i),
                    }))
                  }
                />
              </div>
            ))}
            <Button
              variant="ghost"
              text="+ Adicionar imóvel"
              onClick={() =>
                setPatrimonioImoveis((prev) => ({
                  ...prev,
                  bens: [...(prev.bens || []), { tipo: "casa", valor_comercial: "" }],
                }))
              }
            />
            <div className={styles.calcBox}>
              <p><strong>Valor total dos bens imóveis:</strong> R$ {totalImoveis.toFixed(2)}</p>
            </div>
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(5, { patrimonio_imoveis: patrimonioImoveis })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 7 – BENS MÓVEIS */}
        {currentStep === 6 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Patrimônio – Bens móveis</h2>
            <p className={styles.formDesc}>
              Veículos e outros bens móveis (valor FIPE).
            </p>
            {(patrimonioMoveis.bens || []).map((b, i) => (
              <div key={i} className={styles.familiarCard}>
                <Input
                  label="Tipo (automóvel, moto etc.)"
                  value={b.tipo}
                  onChange={(e) =>
                    setPatrimonioMoveis((prev) => {
                      const n = { ...prev, bens: [...(prev.bens || [])] };
                      n.bens[i] = { ...n.bens[i], tipo: e.target.value };
                      return n;
                    })
                  }
                />
                <Input
                  label="Marca / modelo / ano"
                  value={b.marca_modelo_ano}
                  onChange={(e) =>
                    setPatrimonioMoveis((prev) => {
                      const n = { ...prev, bens: [...(prev.bens || [])] };
                      n.bens[i] = { ...n.bens[i], marca_modelo_ano: e.target.value };
                      return n;
                    })
                  }
                />
                <Input
                  label="Valor conforme Tabela FIPE (R$)"
                  variant="number"
                  min={0}
                  step={0.01}
                  value={b.valor_fipe === "" ? "" : b.valor_fipe}
                  onChange={(e) =>
                    setPatrimonioMoveis((prev) => {
                      const n = { ...prev, bens: [...(prev.bens || [])] };
                      n.bens[i] = { ...n.bens[i], valor_fipe: parseNum(e.target.value) };
                      return n;
                    })
                  }
                />
                <div className={styles.field}>
                  <span className={styles.label}>Financiado?</span>
                  <select
                    className={styles.select}
                    value={b.financiado === true ? "sim" : b.financiado === false ? "nao" : ""}
                    onChange={(e) =>
                      setPatrimonioMoveis((prev) => {
                        const n = { ...prev, bens: [...(prev.bens || [])] };
                        n.bens[i] = { ...n.bens[i], financiado: e.target.value === "sim" };
                        return n;
                      })
                    }
                  >
                    <option value="">Selecione</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </select>
                </div>
                {b.financiado && (
                  <>
                    <Input
                      label="Valor da parcela (R$)"
                      variant="number"
                      min={0}
                      step={0.01}
                      value={b.valor_parcela === "" ? "" : b.valor_parcela}
                      onChange={(e) =>
                        setPatrimonioMoveis((prev) => {
                          const n = { ...prev, bens: [...(prev.bens || [])] };
                          n.bens[i] = { ...n.bens[i], valor_parcela: parseNum(e.target.value) };
                          return n;
                        })
                      }
                    />
                    <Input
                      label="Parcelas restantes"
                      variant="number"
                      min={0}
                      value={b.parcelas_restantes === "" ? "" : b.parcelas_restantes}
                      onChange={(e) =>
                        setPatrimonioMoveis((prev) => {
                          const n = { ...prev, bens: [...(prev.bens || [])] };
                          n.bens[i] = { ...n.bens[i], parcelas_restantes: parseNum(e.target.value) };
                          return n;
                        })
                      }
                    />
                  </>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  text="Remover"
                  onClick={() =>
                    setPatrimonioMoveis((prev) => ({
                      ...prev,
                      bens: prev.bens.filter((_, j) => j !== i),
                    }))
                  }
                />
              </div>
            ))}
            <Button
              variant="ghost"
              text="+ Adicionar bem móvel"
              onClick={() =>
                setPatrimonioMoveis((prev) => ({
                  ...prev,
                  bens: [...(prev.bens || []), { tipo: "", marca_modelo_ano: "", valor_fipe: "" }],
                }))
              }
            />
            <div className={styles.calcBox}>
              <p><strong>Valor total dos bens móveis:</strong> R$ {totalMoveis.toFixed(2)}</p>
            </div>
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(6, { patrimonio_moveis: patrimonioMoveis })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 8 – OUTROS PATRIMÔNIOS */}
        {currentStep === 7 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Outros patrimônios</h2>
            <p className={styles.formDesc}>
              Declaração de valores (R$).
            </p>
            <Input
              label="Dinheiro em espécie (R$)"
              variant="number"
              min={0}
              step={0.01}
              value={outrosPatrimonios.dinheiro_especie === "" ? "" : outrosPatrimonios.dinheiro_especie}
              onChange={(e) => setOutrosPatrimonios((p) => ({ ...p, dinheiro_especie: parseNum(e.target.value) }))}
            />
            <Input
              label="Poupança (R$)"
              variant="number"
              min={0}
              step={0.01}
              value={outrosPatrimonios.poupanca === "" ? "" : outrosPatrimonios.poupanca}
              onChange={(e) => setOutrosPatrimonios((p) => ({ ...p, poupanca: parseNum(e.target.value) }))}
            />
            <Input
              label="Aplicações financeiras (R$)"
              variant="number"
              min={0}
              step={0.01}
              value={outrosPatrimonios.aplicacoes === "" ? "" : outrosPatrimonios.aplicacoes}
              onChange={(e) => setOutrosPatrimonios((p) => ({ ...p, aplicacoes: parseNum(e.target.value) }))}
            />
            <Input
              label="Previdência privada (R$)"
              variant="number"
              min={0}
              step={0.01}
              value={outrosPatrimonios.previdencia_privada === "" ? "" : outrosPatrimonios.previdencia_privada}
              onChange={(e) => setOutrosPatrimonios((p) => ({ ...p, previdencia_privada: parseNum(e.target.value) }))}
            />
            <Input
              label="Consórcios (R$)"
              variant="number"
              min={0}
              step={0.01}
              value={outrosPatrimonios.consorcios === "" ? "" : outrosPatrimonios.consorcios}
              onChange={(e) => setOutrosPatrimonios((p) => ({ ...p, consorcios: parseNum(e.target.value) }))}
            />
            <Input
              label="Patrimônio rural (R$)"
              variant="number"
              min={0}
              step={0.01}
              value={outrosPatrimonios.patrimonio_rural === "" ? "" : outrosPatrimonios.patrimonio_rural}
              onChange={(e) => setOutrosPatrimonios((p) => ({ ...p, patrimonio_rural: parseNum(e.target.value) }))}
            />
            <div className={styles.calcBox}>
              <p><strong>Valor estimado total:</strong> R$ {totalOutros.toFixed(2)}</p>
            </div>
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(7, { outros_patrimonios: outrosPatrimonios })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 9 – DECLARAÇÕES */}
        {currentStep === 8 && (
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Declarações e responsabilidade</h2>
            <p className={styles.formDesc}>
              Leia e marque as declarações abaixo.
            </p>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!declaracoes.veracidade}
                onChange={(e) => setDeclaracoes((p) => ({ ...p, veracidade: e.target.checked }))}
              />
              <span>Declaro a veracidade das informações prestadas.</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!declaracoes.ciencia_omissao_falsidade}
                onChange={(e) => setDeclaracoes((p) => ({ ...p, ciencia_omissao_falsidade: e.target.checked }))}
              />
              <span>Tenho ciência de que a omissão ou falsidade pode implicar indeferimento da inscrição.</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!declaracoes.aceite_termos}
                onChange={(e) => setDeclaracoes((p) => ({ ...p, aceite_termos: e.target.checked }))}
              />
              <span>Aceito os termos e condições institucionais.</span>
            </label>
            <div className={styles.actions}>
              <Button text="Salvar e continuar" onClick={() => saveStep(8, { declaracoes })} loading={saving} />
            </div>
          </div>
        )}

        {/* SEÇÃO 10 – DOCUMENTOS (checklist por familiar) */}
        {currentStep === 9 && (
          <div className={styles.documentsStepWrap}>
            <input
              type="file"
              ref={replaceInputRef}
              className={styles.fileInputHidden}
              accept=".pdf,.jpg,.jpeg,.png"
              aria-hidden
              style={{ position: "absolute", left: -9999 }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && replacingRow) {
                  handleUploadForRow(
                    file,
                    replacingRow.familiarKey,
                    replacingRow.itemId,
                    replacingRow.itemLabel,
                    replacingRow.docId
                  );
                }
                e.target.value = "";
              }}
            />
            <div className={styles.documentsStepInner}>
          <div className={styles.form}>
            <h2 className={styles.formTitle}>Documentos</h2>
            <p className={styles.formDesc}>
              Envie os documentos solicitados para cada membro do grupo familiar. Use &quot;Ocultar&quot; para remover um item da lista quando não se aplicar.
            </p>

            {(() => {
              const candidatoNome = (dadosPessoais?.nome_civil_social ?? "").trim() || "Candidato";
              const membros = dadosFamilia?.membros ?? [];
              const familiares: { key: string; label: string }[] = [
                { key: "candidato", label: candidatoNome },
                ...membros.map((m, i) => ({
                  key: String(i + 1),
                  label: `Membro ${i + 1} - ${(m as MembroFamiliar).nome_completo || `Membro ${i + 1}`}`,
                })),
              ];

              return (
                <div className={styles.docChecklistWrap}>
                  {familiares.map(({ key: familiarKey, label: familiarLabel }) => (
                    <div key={familiarKey} className={styles.docFamiliarBlock}>
                      <h3 className={styles.docFamiliarName}>{familiarLabel}</h3>
                      {DOCUMENT_CHECKLIST.map((section) => (
                        <div key={section.title} className={styles.docSection}>
                          <h4 className={styles.docSectionTitle}>{section.title}</h4>
                          <ul className={styles.docChecklist}>
                            {section.items
                              .filter(
                                (item) =>
                                  !item.onlyCandidato || familiarKey === "candidato"
                              )
                              .filter(
                                (item) =>
                                  !hiddenDocItems.has(`${familiarKey}-${item.id}`)
                              )
                              .map((item) => {
                                const doc = getDocForRow(familiarKey, item.id);
                                const isReplacing =
                                  replacingRow?.familiarKey === familiarKey && replacingRow?.itemId === item.id;
                                const showEnviado = doc && !isReplacing;
                                return (
                                  <li
                                    key={`${familiarKey}-${item.id}`}
                                    className={`${styles.docChecklistItem} ${showEnviado ? styles.docChecklistItemClickable : ""}`}
                                    role={showEnviado ? "button" : undefined}
                                    onClick={showEnviado ? () => {
                                      setViewerDocument({ id: doc!.id, fileName: doc!.fileName });
                                    } : undefined}
                                  >
                                    <span className={styles.docItemNum}>{item.id}</span>
                                    <span className={styles.docItemLabel}>{item.label}</span>
                                    <div className={styles.docItemActions}>
                                      {showEnviado ? (
                                        <>
                                          <span className={styles.docEnviadoLabel}>
                                            Enviado: {doc!.fileName}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            text="Alterar"
                                            className={styles.docAlterarBtn}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setReplacingRow({
                                                docId: doc!.id,
                                                familiarKey,
                                                itemId: item.id,
                                                itemLabel: item.label,
                                              });
                                              setTimeout(() => replaceInputRef.current?.click(), 0);
                                            }}
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <input
                                            type="file"
                                            className={styles.fileInputHidden}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                handleUploadForRow(
                                                  file,
                                                  familiarKey,
                                                  item.id,
                                                  item.label
                                                );
                                              }
                                              e.target.value = "";
                                            }}
                                            id={`file-${familiarKey}-${item.id}`}
                                          />
                                          <label
                                            htmlFor={`file-${familiarKey}-${item.id}`}
                                            className={styles.fileLabel}
                                          >
                                            <span className={styles.fileButton}>
                                              Escolher arquivo
                                            </span>
                                          </label>
                                        </>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        text="Ocultar"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleDocItemHidden(familiarKey, item.id);
                                        }}
                                        className={styles.docOcultarBtn}
                                      />
                                    </div>
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}

            <p className={styles.docHint}>
              Documentos enviados anteriormente (outro formato) continuam abaixo.
            </p>
            {data.documents.filter((d) => !d.documentLabel.includes("|")).length > 0 && (
              <ul className={styles.docList}>
                {data.documents
                  .filter((d) => !d.documentLabel.includes("|"))
                  .map((d) => (
                    <li
                      key={d.id}
                      className={`${styles.docItem} ${styles.docItemClickable}`}
                      role="button"
                      onClick={() => {
                        setViewerDocument({ id: d.id, fileName: d.fileName });
                      }}
                    >
                      <span className={styles.docLabel}>{d.documentLabel}</span>
                      <span className={styles.docNameLink}>{d.fileName}</span>
                    </li>
                  ))}
              </ul>
            )}

            <div className={styles.actions}>
              <Button variant="ghost" text="Voltar" onClick={() => setCurrentStep(8)} />
            </div>
          </div>
            </div>
          </div>
        )}
      </div>

      {viewerDocument && (
        <div className={styles.viewerOverlay} aria-modal="true" role="dialog" aria-label="Visualizar documento">
          <div className={styles.viewerWrap}>
            <header className={styles.viewerHeader}>
              <span className={styles.viewerTitle}>{viewerDocument.fileName}</span>
              <button
                type="button"
                className={styles.viewerClose}
                onClick={() => {
                  setViewerDocument(null);
                  if (viewerUrl) URL.revokeObjectURL(viewerUrl);
                  setViewerUrl(null);
                  setViewerDownloadUrl(null);
                }}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className={styles.viewerContent}>
              {viewerLoading && (
                <div className={styles.viewerLoading}>
                  <span>Carregando…</span>
                </div>
              )}
              {!viewerLoading && viewerUrl && (
                <div className={styles.viewerLayout}>
                  <div className={styles.viewerDoc}>
                    {viewerDocument.fileName.toLowerCase().endsWith(".pdf") ? (
                      <iframe src={viewerUrl} title={viewerDocument.fileName} className={styles.viewerIframe} />
                    ) : (
                      <img src={viewerUrl} alt={viewerDocument.fileName} className={styles.viewerImg} />
                    )}
                  </div>
                  <aside className={styles.viewerSide}>
                    <h3 className={styles.viewerSideTitle}>Ações</h3>
                    <p className={styles.viewerSideHint}>
                      Aqui você visualiza o arquivo online e pode baixar quando quiser.
                    </p>
                    <a
                      href={viewerDownloadUrl ?? "#"}
                      className={styles.viewerDownloadBtn}
                      download={viewerDocument.fileName}
                      onClick={(e) => {
                        if (!viewerDownloadUrl) e.preventDefault();
                      }}
                    >
                      Baixar
                    </a>
                  </aside>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}
      <SilviaRagWidget enabled={currentStep === 9} />
    </section>
  );
}
