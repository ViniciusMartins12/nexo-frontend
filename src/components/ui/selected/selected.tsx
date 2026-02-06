import React from "react";
import styles from "./selected.module.scss";

interface Option {
  value: string;
  label: string;
}

interface SelectedProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export function Selected({
  label,
  options,
  error,
  ...props
}: SelectedProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}

      <div
        className={`${styles.control} ${
          error ? styles.invalid : ""
        }`}
      >
        <select className={styles.select} {...props}>
          <option value="" disabled>
            Selecione uma opção
          </option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
