"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.scss";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  text?: string;              // fallback quando não usa children
  icon?: ReactNode;           // precisa ser JSX: <GoogleIcon /> ou <Image .../>
  iconPosition?: "left" | "right";
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  children,
  text,
  icon,
  iconPosition = "left",
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const label = children ?? text; // ✅ fallback

  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        { [styles.loading]: loading }
      )}
      disabled={disabled || loading}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className={styles.icon}>{icon}</span>
      )}

      {label != null && (
        <span className={styles.label}>
          {loading ? "Carregando..." : label}
        </span>
      )}

      {icon && iconPosition === "right" && (
        <span className={styles.icon}>{icon}</span>
      )}
    </button>
  );
}
