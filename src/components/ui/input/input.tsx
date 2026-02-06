"use client";

import { useState } from "react";
import styles from "./input.module.scss";
import Image from "next/image";

type InputVariant = "text" | "email" | "password" | "date" | "number";

type InputProps = {
  label?: string;
  error?: string;
  variant?: InputVariant;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function Input({
  label,
  error,
  variant = "text",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = variant === "password";

  function getType(): React.HTMLInputTypeAttribute {
    if (isPassword) return showPassword ? "text" : "password";
    return variant;
  }

  function getAutoComplete() {
    if (variant === "email") return "email";
    if (variant === "password") return "current-password";
    return props.autoComplete;
  }

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={`${styles.control} ${error ? styles.invalid : ""}`}>
        <input
          {...props}
          type={getType()}
          autoComplete={getAutoComplete()}
          className={styles.input}
          aria-invalid={!!error}
        />

        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <Image src="/icons/eye-closed.svg" alt="Nexo" width={20} height={20} /> : <Image src="/icons/eye-open.svg" alt="Nexo" width={20} height={20} />}

          </button>
        )}
      </div>

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
