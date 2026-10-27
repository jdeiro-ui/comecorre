"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { supabaseServidor } from "@/db/supabase";

export type EstadoEntrar = { enviado?: boolean; erro?: string };

export async function enviarLink(_: EstadoEntrar, fd: FormData): Promise<EstadoEntrar> {
  const email = z.email().safeParse(fd.get("email"));
  if (!email.success) return { erro: "Informe um e-mail válido." };

  const origem = (await headers()).get("origin");
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${origem}/auth/callback` },
  });
  if (error) return { erro: "Não foi possível enviar o link. Tente de novo em instantes." };
  return { enviado: true };
}
