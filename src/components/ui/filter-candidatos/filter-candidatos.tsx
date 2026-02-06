"use client";

import { Input } from "../input/input";
import styles from "./filter-candidatos.module.scss";

type ProcessOption = { id: string; name: string; type: string };

type FilterCandidatosProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  processOptions: ProcessOption[];
  selectedProcessId: string;
  onProcessChange: (processId: string) => void;
  placeholderSearch?: string;
  placeholderProcess?: string;
};

export function FilterCandidatos({
  searchValue,
  onSearchChange,
  processOptions,
  selectedProcessId,
  onProcessChange,
  placeholderSearch = "Buscar por nome, CPF ou email...",
  placeholderProcess = "Todos os processos",
}: FilterCandidatosProps) {
  return (
    <div className={styles.filter}>
      <div className={styles.searchWrap}>
        <Input
          label="Busca"
          variant="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholderSearch}
          maxLength={200}
        />
      </div>
      <div className={styles.selectWrap}>
        <label className={styles.label}>Processo</label>
        <select
          className={styles.select}
          value={selectedProcessId}
          onChange={(e) => onProcessChange(e.target.value)}
          aria-label="Filtrar por processo"
        >
          <option value="">{placeholderProcess}</option>
          {processOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
