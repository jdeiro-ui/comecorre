"use server";

import { redirect } from "next/navigation";
import { usuarioAtual } from "@/db/supabase";
import { lerPerfil } from "@/lib/formularios";

export type EstadoPerfil = { erros?: Record<string, string> };

export async function salvarPerfil(_: EstadoPerfil, fd: FormData): Promise<EstadoPerfil> {
  const r = lerPerfil(fd);
  if (!r.success) {
    const erros: Record<string, string> = {};
    for (const issue of r.error.issues) erros[String(issue.path[0])] ??= issue.message;
    return { erros };
  }

  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");

  // Preserva a data original dos consentimentos já dados.
  const { data: atual } = await supabase
    .from("profiles")
    .select("consentimento_saude_em, consentimento_alcool_em")
    .eq("id", user.id)
    .maybeSingle();
  const agora = new Date().toISOString();
  const p = r.data;

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    objetivo: p.objetivo,
    peso_kg: p.peso_kg ?? null,
    altura_cm: p.altura_cm ?? null,
    idade: p.idade ?? null,
    restricoes: p.restricoes,
    consentimento_saude_em: atual?.consentimento_saude_em ?? agora,
    consentimento_alcool_em: p.consentimento_alcool ? (atual?.consentimento_alcool_em ?? agora) : null,
    atualizado_em: agora,
  });
  if (error) return { erros: { geral: "Não foi possível salvar. Tente de novo." } };

  // Consentimento de álcool revogado: apagar os registros de álcool.
  if (!p.consentimento_alcool && atual?.consentimento_alcool_em) {
    await supabase.from("alcohol_entries").delete().eq("user_id", user.id);
  }

  redirect("/");
}
