"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.scss";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatCpfInput(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export default function CadastroCandidatoPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const cpfRaw = cpf.replace(/\D/g, "");
  const canVerify = cpfRaw.length === 11 && email.trim().length > 0;
  const canRegister =
    name.trim().length >= 2 &&
    password.length >= 8 &&
    password === confirmPassword;

  async function handleVerify() {
    if (!canVerify) return;
    setLoading(true);
    setErrorMsg(null);
    setCheckMessage(null);
    try {
      const res = await fetch(`${API_URL}/auth/check-candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cpf: cpfRaw,
          email: email.trim().toLowerCase(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMsg(data?.message ?? "Erro ao verificar. Tente novamente.");
        return;
      }
      if (data.allowed) {
        if (data.name) setName(data.name);
        setStep(2);
        setErrorMsg(null);
      } else {
        setCheckMessage(data.message ?? "CPF e email não constam na lista de autorizados.");
      }
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!canRegister) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/auth/register-candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cpf: cpfRaw,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMsg(data?.message ?? "Erro ao cadastrar. Tente novamente.");
        return;
      }
      router.push("/login?cadastro=ok");
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.art} aria-hidden="true">
        <Image
          src="/svg/bg-image.svg"
          alt=""
          fill
          priority
          className={styles.artImage}
        />
      </div>

      <section className={styles.card}>
        <div className={styles.logo}>
          <Image src="/svg/logo.svg" alt="Nexo" width={110} height={40} />
        </div>
        <h1 className={styles.title}>Cadastro de candidato</h1>
        <p className={styles.desc}>
          Verifique se você está na lista de autorizados com CPF e email. Em
          seguida, defina sua senha de acesso.
        </p>

        {step === 1 ? (
          <>
            <div className={styles.fields}>
              <Input
                label="CPF"
                variant="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className={styles.fields}>
              <Input
                label="Email"
                variant="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            {checkMessage && (
              <p className={styles.checkMessage}>{checkMessage}</p>
            )}
            {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
            <Button
              onClick={handleVerify}
              loading={loading}
              disabled={!canVerify}
            >
              Verificar
            </Button>
          </>
        ) : (
          <>
            <div className={styles.stepInfo}>
              <span className={styles.stepLabel}>Etapa 2 de 2</span>
              <button
                type="button"
                className={styles.backLink}
                onClick={() => setStep(1)}
              >
                Alterar CPF/email
              </button>
            </div>
            <div className={styles.fields}>
              <Input
                label="Nome completo"
                variant="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                maxLength={200}
              />
            </div>
            <div className={styles.fields}>
              <Input
                label="Senha"
                variant="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className={styles.fields}>
              <Input
                label="Confirmar senha"
                variant="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
              />
            </div>
            {password && password.length < 8 && (
              <p className={styles.hint}>A senha deve ter no mínimo 8 caracteres.</p>
            )}
            {confirmPassword && password !== confirmPassword && (
              <p className={styles.hint}>As senhas não coincidem.</p>
            )}
            {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
            <Button
              onClick={handleRegister}
              loading={loading}
              disabled={!canRegister}
            >
              Cadastrar
            </Button>
          </>
        )}

        <div className={styles.footerForm}>
          <p>
            Já tem conta?{" "}
            <Link href="/login" className={styles.footerlink}>
              Fazer login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
