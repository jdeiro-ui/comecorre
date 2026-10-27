import Link from "next/link";
import { redirect } from "next/navigation";
import { buscarReferenciaCorporal } from "@/db/corpo";
import { usuarioAtual } from "@/db/supabase";
import { CAMPOS_BIO, NOMES_CAMPOS_BIO } from "@/lib/bio-schema";
import { dataLocal } from "@/lib/datas";
import { metaProteinaG } from "@/lib/scoring";
import { excluirMedida } from "./actions";
import { BioForm } from "./bio-form";

export default async function Corpo() {
  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");

  const [{ data: medidas }, corpo] = await Promise.all([
    supabase
      .from("body_compositions")
      .select("*")
      .eq("user_id", user.id)
      .order("medido_em", { ascending: false })
      .order("criado_em", { ascending: false })
      .limit(10),
    buscarReferenciaCorporal(supabase, user.id),
  ]);
  const base = corpo.massaMagraKg ? "massa magra" : corpo.pesoKg ? "peso" : null;

  return (
    <>
      <h1>Corpo</h1>
      <section>
        <h2>Meta de proteína por refeição</h2>
        <p>
          ~{metaProteinaG("moderado", corpo)} g em dias comuns · ~{metaProteinaG("alto", corpo)} g quando o dia pede mais
        </p>
        <p className="aviso">
          {base ? `Calculada a partir da sua ${base}.` : "Valor padrão: registre uma medição ou seu peso para personalizar."}
        </p>
      </section>

      <section>
        <h2>Nova medição</h2>
        <BioForm hoje={dataLocal()} />
      </section>

      <section>
        <h2>Histórico</h2>
        <p className="aviso">
          Bioimpedância varia com hidratação, horário e refeições. Observe a tendência, não uma medição isolada.
        </p>
        {(medidas ?? []).map((m) => (
          <details key={m.id}>
            <summary>
              {m.medido_em}
              {m.peso_kg != null && ` · ${m.peso_kg} kg`}
              {m.gordura_pct != null && ` · ${m.gordura_pct}% gordura`}
            </summary>
            <ul>
              {NOMES_CAMPOS_BIO.filter((c) => m[c] != null).map((c) => (
                <li key={c}>
                  {CAMPOS_BIO[c].rotulo}: {m[c]} {CAMPOS_BIO[c].unidade}
                </li>
              ))}
            </ul>
            <form action={excluirMedida}>
              <input type="hidden" name="id" value={m.id} />
              <button>Excluir medição</button>
            </form>
          </details>
        ))}
      </section>
      <p>
        <Link href="/">Voltar</Link>
      </p>
    </>
  );
}
