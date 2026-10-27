"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServidor, usuarioAtual } from "@/db/supabase";
import { classificarTreino } from "@/lib/classify-workout";
import { dataLocal, somarDias } from "@/lib/datas";
import { lerTreino } from "@/lib/formularios";
import type { Categoria } from "@/rules/types";

export type EstadoTreino = {
  erro?: string;
  /** Classificação ambígua: perguntar ao usuário entre estas categorias. */
  pergunta?: Categoria[];
  /** Valores enviados, para reexibir o formulário após a pergunta. */
  valores?: Record<string, string>;
  salvo?: boolean;
};

export async function salvarTreino(_: EstadoTreino, fd: FormData): Promise<EstadoTreino> {
  const valores = Object.fromEntries([...fd].map(([k, v]) => [k, String(v)]));
  const r = lerTreino(fd);
  if (!r.success) return { erro: r.error.issues[0].message, valores };
  const t = r.data;

  const c = classificarTreino(t);
  let categoria: Categoria;
  if (!c.ambigua) categoria = c.categoria;
  else if (t.categoria && c.opcoes.includes(t.categoria)) categoria = t.categoria;
  else return { pergunta: c.opcoes, valores };

  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");

  const hoje = dataLocal();
  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    data: t.dia === "hoje" ? hoje : somarDias(hoje, 1),
    fonte: "manual",
    tipo: t.tipo,
    duracao_min: t.duracaoMin,
    distancia_km: t.distanciaKm ?? null,
    intensidade: t.intensidade,
    categoria,
    planejado: t.planejado,
  });
  if (error) return { erro: "Não foi possível salvar o treino.", valores };

  revalidatePath("/");
  return { salvo: true };
}

export async function excluirTreino(fd: FormData) {
  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");
  await supabase.from("workouts").delete().eq("id", String(fd.get("id"))).eq("user_id", user.id);
  revalidatePath("/");
}

export async function sair() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}
