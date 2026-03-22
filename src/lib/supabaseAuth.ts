import { getSupabase } from "./supabaseClient";

/**
 * supabaseAuth
 *
 * Responsável por:
 * - obter o JWT da sessão do Supabase
 * - anexar Authorization: Bearer <token>
 * - realizar chamadas autenticadas ao backend (Nest)
 *
 * NÃO deve conter regras de negócio.
 */
export async function supabaseAuth(
  path: string,
  init: RequestInit = {}
) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const base = process.env.NEXT_PUBLIC_API_URL!;
  return fetch(`${base}${path}`, { ...init, headers });
}
