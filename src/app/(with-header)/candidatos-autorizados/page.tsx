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
