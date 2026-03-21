"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import styles from "./menu.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type MenuProps = {
  isOpen: boolean;
  onClose: () => void;
  /** "candidate" = só Mensagens, Processos e tema; "company" = menu completo */
  variant?: "company" | "candidate";
  /** Se true (atendente), esconde Dashboard e Funcionários */
  isAtendente?: boolean;
};

export function Menu({ isOpen, onClose, variant = "company", isAtendente = false }: MenuProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  if (!isOpen) return null;

  const linkProps = { onClick: onClose };

  const isCandidate = variant === "candidate";
  const showDashboard = !isCandidate && !isAtendente;
  const showFuncionarios = !isCandidate && !isAtendente;
  const showCursos = !isCandidate && !isAtendente;

  const handleLogout = () => {
    onClose();
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).then(
      () => router.push("/login")
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={styles.menu}
        onClick={(e) => e.stopPropagation()}
      >
        <nav>
          {showDashboard && (
            <Link href="/dashboard" {...linkProps}>
              <Image src="/icons/dash.svg" alt="" width={15} height={15} />
              <span>Dashboard</span>
            </Link>
          )}
          <Link href={isCandidate ? "/candidato/processos" : "/processos"} {...linkProps}>
            <Image src="/icons/process.svg" alt="" width={15} height={15} />
            <span>Processos</span>
          </Link>
          {!isCandidate && (
            <>
              <Link href="/carteiras" {...linkProps}>
                <Image src="/icons/wallets.svg" alt="" width={15} height={15} />
                <span>Carteiras</span>
              </Link>
            </>
          )}
          <Link href={isCandidate ? "/candidato/mensagens" : "/mensagens"} {...linkProps}>
            <Image src="/icons/envelope.svg" alt="" width={15} height={15} />
            <span>Mensagens</span>
          </Link>
          {!isCandidate && (
            <Link href="/candidatos-autorizados" {...linkProps}>
              <Image src="/icons/autorization.svg" alt="" width={15} height={15} />
              <span>Candidatos autorizados</span>
            </Link>
          )}
          {showFuncionarios && (
            <Link href="/funcionarios" {...linkProps}>
              <Image src="/icons/user-add.svg" alt="" width={15} height={15} />
              <span>Funcionários</span>
            </Link>
          )}
          {showCursos && (
            <Link href="/cursos" {...linkProps}>
              <Image src="/icons/fi-rs-browser.svg" alt="" width={15} height={15} />
              <span>Cursos</span>
            </Link>
          )}
          {!isCandidate && (
            <Link href="/configuracoes" {...linkProps}>
              <Image src="/svg/settings.svg" alt="" width={15} height={15} />
              <span>Configurações</span>
            </Link>
          )}
          {isCandidate && (
            <Link href="/candidato/configuracoes" {...linkProps}>
              <Image src="/svg/settings.svg" alt="" width={15} height={15} />
              <span>Configurações</span>
            </Link>
          )}
          <div className={styles.logoWrap}>
            <Link href={isCandidate ? "/candidato" : isAtendente ? "/processos" : "/dashboard"} className={styles.logoSilviIALink} onClick={onClose} aria-label="SilvIA">
              <span className={styles.logoSilviIA}>
                <span className={styles.logoIcon} aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="url(#menuLogoGrad)" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                    <circle cx="12" cy="12" r="2.5" fill="url(#menuLogoGrad)" />
                    <defs>
                      <linearGradient id="menuLogoGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0795FF" />
                        <stop offset="1" stopColor="#004AAD" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <span className={styles.logoWord}>Silv</span>
                <span className={styles.logoIA}>IA</span>
              </span>
            </Link>
          </div>
          <div className={styles.line}></div>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {theme === "dark" ? (
              <>
                <span className={styles.sunIcon} aria-hidden>☀</span>
                <span>Modo claro</span>
              </>
            ) : (
              <>
                <Image src="/icons/moon.svg" alt="" width={15} height={15} />
                <span>Modo escuro</span>
              </>
            )}
          </button>
          {isCandidate && (
            <>
              <div className={styles.line}></div>
              <button
                type="button"
                className={styles.themeToggle}
                onClick={handleLogout}
                aria-label="Sair"
              >
                <span>Sair</span>
              </button>
            </>
          )}
        </nav>
      </aside>
    </div>
  );
}
