/** Rotas de auth não devem ser pré-renderizadas no build (Supabase + PKCE no cliente). */
export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
