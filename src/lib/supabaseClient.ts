import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Cliente Supabase (browser). Criação lazy para não falhar o `next build`
 * quando NEXT_PUBLIC_* ainda não estão disponíveis na avaliação do módulo.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel → Settings → Environment Variables ou .env.local)."
    );
  }
  client = createClient(url, key);
  return client;
}

/**
 * Compatibilidade com código que importa `supabase` diretamente.
 * Só instancia o client na primeira chamada a um método/propriedade.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const c = getSupabase();
    const value = Reflect.get(c, prop, c);
    if (typeof value === "function") {
      return value.bind(c);
    }
    return value;
  },
});
