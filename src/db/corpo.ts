import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferenciaCorporal } from "@/lib/scoring";

/** Referência para a meta de proteína: última bioimpedância; se não houver, o peso do perfil. */
export async function buscarReferenciaCorporal(supabase: SupabaseClient, userId: string): Promise<ReferenciaCorporal> {
  const [{ data: medida }, { data: perfil }] = await Promise.all([
    supabase
      .from("body_compositions")
      .select("peso_kg, massa_magra_kg")
      .eq("user_id", userId)
      .order("medido_em", { ascending: false })
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("peso_kg").eq("id", userId).maybeSingle(),
  ]);
  return {
    pesoKg: medida?.peso_kg ?? perfil?.peso_kg ?? null,
    massaMagraKg: medida?.massa_magra_kg ?? null,
  };
}
