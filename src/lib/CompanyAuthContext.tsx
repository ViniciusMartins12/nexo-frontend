"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type CompanyUser = {
  id: string;
  email: string | null;
  name: string | null;
  companyId: string;
  roles: string[];
};

type CompanyAuthContextValue = {
  type: "company" | "candidate" | null;
  user: CompanyUser | null;
  setSyncResult: (data: { type: "company" | "candidate"; user: CompanyUser } | null) => void;
  /** true se for usuário company com role atendente e sem admin */
  isAtendente: boolean;
};

const CompanyAuthContext = createContext<CompanyAuthContextValue | null>(null);

export function CompanyAuthProvider({ children }: { children: ReactNode }) {
  const [type, setType] = useState<"company" | "candidate" | null>(null);
  const [user, setUser] = useState<CompanyUser | null>(null);

  const setSyncResult = useCallback(
    (data: { type: "company" | "candidate"; user: CompanyUser } | null) => {
      if (!data) {
        setType(null);
        setUser(null);
        return;
      }
      setType(data.type);
      setUser(data.user);
    },
    []
  );

  const isAtendente =
    type === "company" &&
    !!user?.roles?.length &&
    user.roles.includes("atendente") &&
    !user.roles.includes("admin");

  return (
    <CompanyAuthContext.Provider
      value={{ type, user, setSyncResult, isAtendente }}
    >
      {children}
    </CompanyAuthContext.Provider>
  );
}

export function useCompanyAuth() {
  const ctx = useContext(CompanyAuthContext);
  return (
    ctx ?? {
      type: null,
      user: null,
      setSyncResult: () => {},
      isAtendente: false,
    }
  );
}
