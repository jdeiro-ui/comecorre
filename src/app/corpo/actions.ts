"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/db/supabase";
import { extrairBioimpedancia, TAMANHO_MAX_IMAGEM, TIPOS_IMAGEM } from "@/lib/bio-extract";
import { NOMES_CAMPOS_BIO } from "@/lib/bio-schema";
import { lerBio } from "@/lib/formularios";

export type EstadoBio = {
  etapa: "envio" | "confirmacao";
  fonte?: "print" | "manual";
  /** Valores para pré-preencher a confirmação. */
  valores?: Record<string, string>;
  erro?: string;
};

/** Lê o print em memória e devolve os valores para o usuário confirmar. Nada é salvo aqui. */
export async function lerPrint(_: EstadoBio, fd: FormData): Promise<EstadoBio> {
  const { user } = await usuarioAtual();
  if (!user) redirect("/entrar");

  const arquivo = fd.get("print");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { etapa: "envio", erro: "Escolha um print." };
  const tipo = TIPOS_IMAGEM.find((t) => t === arquivo.type);
  if (!tipo) return { etapa: "envio", erro: "Envie uma imagem PNG, JPG, WebP ou GIF." };
  if (arquivo.size > TAMANHO_MAX_IMAGEM) return { etapa: "envio", erro: "Imagem acima de 4 MB." };

  let extracao;
  try {
    extracao = await extrairBioimpedancia(Buffer.from(await arquivo.arrayBuffer()), tipo);
  } catch {
    return { etapa: "envio", erro: "Não foi possível ler o print agora. Tente de novo ou preencha manualmente." };
  }
  if (!extracao || !extracao.e_bioimpedancia) {
    return { etapa: "envio", erro: "Não reconhecemos um resultado de bioimpedância nesta imagem." };
  }

  const valores: Record<string, string> = {};
  for (const c of NOMES_CAMPOS_BIO) {
    const v = extracao.medidas[c];
    if (v !== null) valores[c] = String(v);
  }
  if (extracao.data_medicao) valores.medido_em = extracao.data_medicao;
  return { etapa: "confirmacao", fonte: "print", valores };
}

export async function preencherManual(): Promise<EstadoBio> {
  return { etapa: "confirmacao", fonte: "manual", valores: {} };
}

export async function salvarMedidas(estado: EstadoBio, fd: FormData): Promise<EstadoBio> {
  const r = lerBio(fd);
  if (!r.success) {
    return { ...estado, valores: Object.fromEntries([...fd].map(([k, v]) => [k, String(v)])), erro: r.error.issues[0].message };
  }
  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");

  const medidas = Object.fromEntries(Object.entries(r.data.medidas).map(([k, v]) => [k, v ?? null]));
  const { error } = await supabase
    .from("body_compositions")
    .insert({ user_id: user.id, medido_em: r.data.medido_em, fonte: r.data.fonte, ...medidas });
  if (error) return { ...estado, erro: "Não foi possível salvar." };

  revalidatePath("/corpo");
  return { etapa: "envio" };
}

export async function excluirMedida(fd: FormData) {
  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");
  await supabase.from("body_compositions").delete().eq("id", String(fd.get("id"))).eq("user_id", user.id);
  revalidatePath("/corpo");
}
