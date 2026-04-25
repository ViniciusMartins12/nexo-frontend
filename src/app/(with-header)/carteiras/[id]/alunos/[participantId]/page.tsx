"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type InscricaoResponse = {
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
  } | null;
  steps: { step_index: number; name: string; is_done: boolean }[];
  documents: { id: string; documentLabel: string; fileName: string; uploadedAt: string }[];
  participant: { id: string; name: string; cpf: string; email: string | null };
};

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <p className={styles.field}>
      <span className={styles.fieldLabel}>{label}:</span>{" "}
      <span className={styles.fieldValue}>
        {typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value)}
      </span>
    </p>
  );
}

export default function AlunoInscricaoPage() {
  const params = useParams();
  const walletId = params?.id as string;
  const participantId = params?.participantId as string;
  const [data, setData] = useState<InscricaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerDocument, setViewerDocument] = useState<{ id: string; fileName: string } | null>(null);
  const [viewerDownloadUrl, setViewerDownloadUrl] = useState<string | null>(null);
  const [viewerOnlineUrl, setViewerOnlineUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  useEffect(() => {
    if (!walletId || !participantId) return;
    fetch(
      `${API_URL}/carteiras/${walletId}/participants/${participantId}/inscricao`,
      { credentials: "include" }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Não foi possível carregar");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Não foi possível carregar a inscrição."))
      .finally(() => setLoading(false));
  }, [walletId, participantId]);

  function inferMimeType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    return "application/octet-stream";
  }

  async function openDocumentOnline(docId: string, fileName: string) {
    try {
      setViewerLoading(true);
      setViewerDocument({ id: docId, fileName });
      setViewerDownloadUrl(null);
      setViewerOnlineUrl(null);
      const res = await fetch(
        `${API_URL}/carteiras/${walletId}/participants/${participantId}/documents/${docId}/url`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erro ao obter link");
      const { url } = await res.json();
      setViewerDownloadUrl(url);

      const fileRes = await fetch(url);
      if (!fileRes.ok) throw new Error("Erro ao carregar arquivo");
      const arrayBuffer = await fileRes.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: inferMimeType(fileName) });
      const objectUrl = URL.createObjectURL(blob);
      setViewerOnlineUrl(objectUrl);
    } catch {
      setViewerDocument(null);
      setError("Erro ao abrir documento.");
    } finally {
      setViewerLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      if (viewerOnlineUrl) URL.revokeObjectURL(viewerOnlineUrl);
    };
  }, [viewerOnlineUrl]);

  const viewerType = useMemo<"pdf" | "image" | "other">(() => {
    if (!viewerDocument) return "other";
    const lower = viewerDocument.fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "pdf";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp") || lower.endsWith(".gif")) {
      return "image";
    }
    return "other";
  }, [viewerDocument]);

  if (loading) {
    return (
      <main className={styles.container}>
        <section className={styles.sectionWrap}>
          <p className={styles.loading}>Carregando...</p>
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.container}>
        <section className={styles.sectionWrap}>
          <p className={styles.errorMsg}>{error ?? "Dados não encontrados."}</p>
          <Link href={`/carteiras/${walletId}/alunos`} className={styles.backLink}>
            ← Voltar aos alunos
          </Link>
        </section>
      </main>
    );
  }

  const fd = data.application?.form_data ?? {};
  const steps = data.steps ?? [];
  const docs = data.documents ?? [];

  return (
    <main className={styles.container}>
      <section className={styles.sectionWrap}>
        <Link href={`/carteiras/${walletId}/alunos`} className={styles.backLink}>
          ← Voltar aos alunos
        </Link>

        <h1 className={styles.pageTitle}>{data.participant.name}</h1>
        <p className={styles.meta}>
          Processo: {data.process.name} · CPF: {formatCpf(data.participant.cpf)}
          {data.participant.email && ` · ${data.participant.email}`}
        </p>

        <Section title="Etapa do envio">
          <p className={styles.stepIntro}>
            O candidato está nas seguintes etapas do formulário de inscrição:
          </p>
          <ul className={styles.stepList}>
            {steps.map((s) => (
              <li
                key={s.step_index}
                className={s.is_done ? styles.stepDone : styles.stepPending}
              >
                {s.is_done ? "✓" : "○"} {s.name}
              </li>
            ))}
          </ul>
        </Section>

        {Boolean(fd.dados_pessoais && typeof fd.dados_pessoais === "object") && (
          <Section title="1. Dados pessoais do candidato">
            {Object.entries(fd.dados_pessoais as Record<string, unknown>).map(
              ([k, v]) => (
                <Field
                  key={k}
                  label={k.replace(/_/g, " ")}
                  value={v as string | number | boolean}
                />
              )
            )}
          </Section>
        )}

        {Boolean(fd.endereco_familia && typeof fd.endereco_familia === "object") && (
          <Section title="2. Endereço da família">
            {Object.entries(fd.endereco_familia as Record<string, unknown>).map(
              ([k, v]) => (
                <Field
                  key={k}
                  label={k.replace(/_/g, " ")}
                  value={v as string}
                />
              )
            )}
          </Section>
        )}

        {Boolean(fd.ensino_medio && typeof fd.ensino_medio === "object") && (
          <Section title="3. Ensino médio">
            {Object.entries(fd.ensino_medio as Record<string, unknown>).map(
              ([k, v]) => (
                <Field
                  key={k}
                  label={k.replace(/_/g, " ")}
                  value={v as string}
                />
              )
            )}
          </Section>
        )}

        {Boolean(fd.dados_familia && typeof fd.dados_familia === "object") && (
          <Section title="4. Dados da família">
            <pre className={styles.jsonBlock}>
              {JSON.stringify(fd.dados_familia, null, 2)}
            </pre>
          </Section>
        )}

        {Boolean(fd.renda_familiar && typeof fd.renda_familiar === "object") && (
          <Section title="5. Renda familiar">
            <pre className={styles.jsonBlock}>
              {JSON.stringify(fd.renda_familiar, null, 2)}
            </pre>
          </Section>
        )}

        {Boolean(fd.patrimonio_imoveis && typeof fd.patrimonio_imoveis === "object") && (
          <Section title="6. Bens imóveis">
            <pre className={styles.jsonBlock}>
              {JSON.stringify(fd.patrimonio_imoveis, null, 2)}
            </pre>
          </Section>
        )}

        {Boolean(fd.patrimonio_moveis && typeof fd.patrimonio_moveis === "object") && (
          <Section title="7. Bens móveis">
            <pre className={styles.jsonBlock}>
              {JSON.stringify(fd.patrimonio_moveis, null, 2)}
            </pre>
          </Section>
        )}

        {Boolean(fd.outros_patrimonios && typeof fd.outros_patrimonios === "object") && (
          <Section title="8. Outros patrimônios">
            <pre className={styles.jsonBlock}>
              {JSON.stringify(fd.outros_patrimonios, null, 2)}
            </pre>
          </Section>
        )}

        {Boolean(fd.declaracoes && typeof fd.declaracoes === "object") && (
          <Section title="9. Declarações">
            <pre className={styles.jsonBlock}>
              {JSON.stringify(fd.declaracoes, null, 2)}
            </pre>
          </Section>
        )}

        <Section title="Documentos enviados">
          {docs.length === 0 ? (
            <p className={styles.empty}>Nenhum documento enviado ainda.</p>
          ) : (
            <ul className={styles.docList}>
              {docs.map((d) => (
                <li key={d.id} className={styles.docItem}>
                  <span className={styles.docLabel}>
                    {d.documentLabel ?? "Documento"}
                  </span>
                  <span className={styles.docName}>{d.fileName}</span>
                  <button
                    type="button"
                    className={styles.docBtn}
                    onClick={() => openDocumentOnline(d.id, d.fileName)}
                  >
                    Abrir online
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </section>

      {viewerDocument && (
        <div className={styles.viewerOverlay} aria-modal="true" role="dialog" aria-label="Visualização de documento">
          <div className={styles.viewerWrap}>
            <header className={styles.viewerHeader}>
              <span className={styles.viewerTitle}>{viewerDocument.fileName}</span>
              <button
                type="button"
                className={styles.viewerClose}
                onClick={() => {
                  if (viewerOnlineUrl) URL.revokeObjectURL(viewerOnlineUrl);
                  setViewerOnlineUrl(null);
                  setViewerDownloadUrl(null);
                  setViewerDocument(null);
                }}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className={styles.viewerBody}>
              <div className={styles.viewerOnlinePane}>
                {viewerLoading && <p className={styles.viewerLoading}>Carregando documento...</p>}
                {!viewerLoading && viewerOnlineUrl && viewerType === "pdf" && (
                  <iframe src={viewerOnlineUrl} title={viewerDocument.fileName} className={styles.viewerFrame} />
                )}
                {!viewerLoading && viewerOnlineUrl && viewerType === "image" && (
                  <img src={viewerOnlineUrl} alt={viewerDocument.fileName} className={styles.viewerImage} />
                )}
                {!viewerLoading && viewerOnlineUrl && viewerType === "other" && (
                  <p className={styles.viewerHint}>Pré-visualização indisponível para esse tipo de arquivo.</p>
                )}
              </div>
              <aside className={styles.viewerActions}>
                <a
                  href={viewerDownloadUrl ?? "#"}
                  className={styles.docBtn}
                  download={viewerDocument.fileName}
                  onClick={(e) => {
                    if (!viewerDownloadUrl) e.preventDefault();
                  }}
                >
                  Baixar
                </a>
              </aside>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
