"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./page.module.scss";
import { FilterCandidatos } from "@/components/ui/filter-candidatos";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type CandidatoItem = {
  id: string;
  cpf: string;
  email: string | null;
  name: string;
  process_id: string;
  process_name: string;
  process_type: string;
  created_at: string;
  curso: string | null;
  turno: string | null;
  media_enem: string | null;
};

type ProcessOption = { id: string; name: string; type: string };

function formatCpf(cpf: string) {
  const d = cpf.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function typeLabel(type: string) {
  return type === "manutencao" ? "Manutenção de bolsas" : "Novo Processo";
}

function turnoLabel(turno: string | null) {
  if (!turno) return "—";
  const map: Record<string, string> = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
    integral: "Integral",
  };
  return map[turno] ?? turno;
}

const CSV_HEADERS = [
  "Nome",
  "CPF",
  "Email",
  "Processo",
  "Tipo",
  "Média ENEM",
  "Curso",
  "Turno",
];

function buildCsvLine(values: string[]): string {
  return values
    .map((v) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    })
    .join(",");
}

function downloadCsv(filename: string, rows: string[][]) {
  const header = buildCsvLine(CSV_HEADERS);
  const body = rows.map((r) => buildCsvLine(r)).join("\r\n");
  const blob = new Blob(["\uFEFF" + header + "\r\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CandidatosAutorizadosPage() {
  const [list, setList] = useState<CandidatoItem[]>([]);
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [processFilter, setProcessFilter] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/candidatos-autorizados`, { credentials: "include" }),
      fetch(`${API_URL}/processes`, { credentials: "include" }),
    ])
      .then(async ([resCand, resProc]) => {
        if (!resCand.ok) throw new Error("Erro ao carregar candidatos");
        if (!resProc.ok) throw new Error("Erro ao carregar processos");
        const [cand, proc] = await Promise.all([
          resCand.json() as Promise<CandidatoItem[]>,
          resProc.json() as Promise<{ id: string; name: string; type: string }[]>,
        ]);
        setList(Array.isArray(cand) ? cand : []);
        setProcesses(Array.isArray(proc) ? proc : []);
      })
      .catch(() => setError("Não foi possível carregar os dados."))
      .finally(() => setLoading(false));
  }, []);

  const filteredList = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const byProcess = processFilter.trim();
    return list.filter((item) => {
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        (item.email?.toLowerCase().includes(q) ?? false);
      const matchProcess = !byProcess || item.process_id === byProcess;
      return matchSearch && matchProcess;
    });
  }, [list, searchText, processFilter]);

  if (loading) {
    return (
      <main className={styles.container}>
        <section className={styles.section}>
          <div className={styles.skeletonHeader}>
            <Skeleton variant="title" />
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
          <h1 className={styles.title}>Candidatos autorizados</h1>
          <p className={styles.description}>
            Candidatos inseridos nos processos e seus respectivos processos.
          </p>
        </div>

        <div className={styles.filterWrap}>
          <FilterCandidatos
            searchValue={searchText}
            onSearchChange={setSearchText}
            processOptions={processes}
            selectedProcessId={processFilter}
            onProcessChange={setProcessFilter}
            placeholderSearch="Buscar por nome, CPF ou email..."
            placeholderProcess="Todos os processos"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.csvButton}
            onClick={() => {
              const rows = filteredList.map((item) => [
                item.name,
                item.cpf.replace(/\D/g, ""),
                item.email ?? "",
                item.process_name,
                typeLabel(item.process_type),
                item.media_enem ?? "",
                item.curso ?? "",
                item.turno ?? "",
              ]);
              downloadCsv("candidatos-autorizados.csv", rows);
            }}
            disabled={filteredList.length === 0}
          >
            Exportar CSV
          </button>
          <button
            type="button"
            className={styles.csvButtonSecondary}
            onClick={() => {
              downloadCsv("modelo-candidatos-autorizados.csv", [
                ["Fulano da Silva", "12345678900", "fulano@email.com", "Processo 2025", "Novo Processo", "583,92", "Engenharia de Software", "manha"],
              ]);
            }}
          >
            Download modelo CSV
          </button>
        </div>

        {filteredList.length === 0 ? (
          <p className={styles.empty}>
            {list.length === 0
              ? "Nenhum candidato inserido nos processos ainda. Adicione participantes via CSV na criação ou edição de um processo."
              : "Nenhum resultado para os filtros aplicados."}
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Email</th>
                  <th>Processo</th>
                  <th>Tipo</th>
                  <th>Média ENEM</th>
                  <th>Curso</th>
                  <th>Turno</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.cellName}>{item.name}</td>
                    <td>{formatCpf(item.cpf)}</td>
                    <td>{item.email ?? "—"}</td>
                    <td>{item.process_name}</td>
                    <td>{typeLabel(item.process_type)}</td>
                    <td>{item.media_enem ?? "—"}</td>
                    <td>{item.curso ?? "—"}</td>
                    <td>{turnoLabel(item.turno)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
