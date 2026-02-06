"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "./modal-funcionario.module.scss";
import { Input } from "../input/input";
import { Selected } from "../selected/selected";
import { Button } from "../button/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type FuncionarioCreated = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  role: string;
  created_at: string;
};

export type FuncionarioForEdit = {
  id: string;
  name: string | null;
  email: string | null;
  cpf: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[];
};

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "coordinator", label: "Coordenador" },
  { value: "viewer", label: "Visualizador" },
  { value: "atendente", label: "Atendente" },
];

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCpfDisplay(cpf: string | null) {
  if (!cpf || cpf.length !== 11) return cpf ?? "—";
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

const PASSWORD_RULES = [
  { id: "length", label: "Mínimo 8 caracteres", test: (s: string) => s.length >= 8 },
  { id: "upper", label: "Pelo menos 1 letra maiúscula", test: (s: string) => /[A-Z]/.test(s) },
  { id: "lower", label: "Pelo menos 1 letra minúscula", test: (s: string) => /[a-z]/.test(s) },
  { id: "number", label: "Pelo menos 1 número", test: (s: string) => /\d/.test(s) },
  {
    id: "special",
    label: "Pelo menos 1 caractere especial (!@#$%^&*...)",
    test: (s: string) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(s),
  },
];

type ModalFuncionarioProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (funcionario?: FuncionarioCreated) => void;
  initialFuncionario?: FuncionarioForEdit | null;
  onUpdated?: (data: { id: string; name: string | null; email: string | null; cpf: string | null; roles: string[]; created_at: string }) => void;
};

export function ModalFuncionario({
  isOpen,
  onClose,
  onCreated,
  initialFuncionario,
  onUpdated,
}: ModalFuncionarioProps) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEdit = !!initialFuncionario;

  useEffect(() => {
    if (!isOpen) return;
    if (initialFuncionario) {
      setName(initialFuncionario.name ?? "");
      setEmail(initialFuncionario.email ?? "");
      setCpf(formatCpfDisplay(initialFuncionario.cpf));
      setRole(initialFuncionario.roles[0] ?? "");
      setPassword("");
      setConfirmPassword("");
    } else {
      setName("");
      setCpf("");
      setEmail("");
      setRole("");
      setPassword("");
      setConfirmPassword("");
    }
    setErrorMsg(null);
  }, [isOpen, initialFuncionario]);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const passwordValid = passwordChecks.every((c) => c.ok);
  const passwordsMatch =
    password.length > 0 && password === confirmPassword;

  const cpfDigits = cpf.replace(/\D/g, "");
  const canSubmitCreate =
    name.trim().length >= 2 &&
    cpfDigits.length === 11 &&
    email.trim().length > 0 &&
    role !== "" &&
    passwordValid &&
    passwordsMatch;
  const canSubmitEdit =
    name.trim().length >= 2 &&
    role !== "" &&
    (password.length === 0 || (passwordValid && passwordsMatch));
  const canSubmit = isEdit ? canSubmitEdit : canSubmitCreate;

  if (!isOpen) return null;

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isEdit) setCpf(formatCpf(e.target.value));
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isEdit && initialFuncionario) {
        const body: { name?: string; role?: string; password?: string } = {
          name: name.trim(),
          role,
        };
        if (password.length > 0 && passwordValid && passwordsMatch) {
          body.password = password;
        }
        const res = await fetch(`${API_URL}/funcionarios/${initialFuncionario.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
          setErrorMsg(message ?? "Erro ao atualizar funcionário");
          return;
        }
        onUpdated?.(data);
        onClose();
      } else {
        const res = await fetch(`${API_URL}/funcionarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            cpf: cpfDigits,
            email: email.trim().toLowerCase(),
            role,
            password,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
          setErrorMsg(message ?? "Erro ao criar funcionário");
          return;
        }
        onCreated?.(data);
        onClose();
      }
    } catch {
      setErrorMsg("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.inner}>
          <h2 className={styles.title}>
            {isEdit ? "Editar funcionário" : "Novo funcionário"}
          </h2>
          <p className={styles.subtitle}>
            {isEdit
              ? "Altere nome, função ou defina uma nova senha (opcional)."
              : "Preencha os dados e defina uma senha de acesso segura."}
          </p>

          <div className={styles.form}>
            <Input
              label="Nome completo"
              variant="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Maria Silva"
              maxLength={200}
            />

            <Input
              label="CPF"
              variant="text"
              value={cpf}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              disabled={isEdit}
            />

            <Input
              label="Email"
              variant="email"
              value={email}
              onChange={(e) => !isEdit && setEmail(e.target.value)}
              placeholder="email@empresa.com"
              disabled={isEdit}
            />

            <Selected
              label="Função (role)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={ROLES}
            />

            <div className={styles.passwordBlock}>
              <Input
                label={isEdit ? "Nova senha (opcional)" : "Senha de acesso"}
                variant="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Deixe em branco para manter" : "Senha segura"}
                autoComplete="new-password"
              />
              <ul className={styles.rules} aria-label="Regras da senha">
                {passwordChecks.map((c) => (
                  <li
                    key={c.id}
                    className={c.ok ? styles.ruleOk : styles.rulePending}
                  >
                    {c.ok ? "✓" : "○"} {c.label}
                  </li>
                ))}
              </ul>
            </div>

            <Input
              label={isEdit ? "Confirmar nova senha" : "Confirmar senha"}
              variant="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className={styles.rulePending}>As senhas não coincidem.</p>
            )}
          </div>

          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <div className={styles.buttons}>
            <Button
              text="Cancelar"
              variant="ghost"
              onClick={onClose}
              type="button"
            />
            <Button
              text={isEdit ? "Salvar alterações" : "Criar funcionário"}
              onClick={handleSubmit}
              loading={loading}
              disabled={!canSubmit}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
