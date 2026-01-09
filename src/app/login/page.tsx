"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.scss";
import Image from "next/image";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.message ?? "Email ou senha inválidos");
        return;
      }

      router.push("/dashboard");
    } catch {
      setErrorMsg("Erro de conexão com o servidor");
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

        <h1 className={styles.subtitle}>Acesse sua conta</h1>

        <div className={styles.fields}>
          <Input
            placeholder="Digite seu e-mail"
            variant="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.fields}>
          <Input
            placeholder="Digite sua senha"
            variant="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

        <Button onClick={handleLogin} loading={loading} disabled={!email || !password}>
          Entrar
        </Button>

        <div className={styles.forgotWrapper}>
          <a href="/forgot-password" className={styles.forgotLink}>
            Esqueci a senha
          </a>
        </div>

        <hr className={styles.divider} />

        {/* ✅ Por enquanto, deixa Google oculto/desabilitado até o BFF de OAuth estar pronto */}
        {/* <p>Ou continue com</p>
        <Button
          onClick={() => (window.location.href = `${API_URL}/auth/google`)}
          icon={<Image src="/svg/google.svg" alt="Google" width={20} height={20} />}
          variant="ghost"
        >
          Google
        </Button> */}

        <div className={styles.footerForm}>
          <p>
            Não tem conta?{" "}
            <a href="/register-account" className={styles.footerlink}>
              Crie agora mesmo
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
