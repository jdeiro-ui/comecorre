import { redirect } from "next/navigation";
import { usuarioAtual } from "@/db/supabase";
import type { Objetivo, Restricao } from "@/rules/types";
import { PerfilForm } from "./form";

export default async function Onboarding() {
  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");

  const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (
    <>
      <h1>{p ? "Perfil" : "Vamos começar"}</h1>
      <PerfilForm
        inicial={{
          objetivo: p?.objetivo as Objetivo | undefined,
          peso_kg: p?.peso_kg,
          altura_cm: p?.altura_cm,
          idade: p?.idade,
          restricoes: (p?.restricoes ?? []) as Restricao[],
          consentimento_saude: Boolean(p?.consentimento_saude_em),
          consentimento_alcool: Boolean(p?.consentimento_alcool_em),
        }}
      />
    </>
  );
}
