import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/db/supabase";
import { categoriaDoDia } from "@/lib/classify-workout";
import { dataLocal, somarDias } from "@/lib/datas";
import { ROTULO_CATEGORIA, ROTULO_INTENSIDADE, ROTULO_TIPO } from "@/lib/rotulos";
import type { Intensidade, TipoTreino } from "@/rules/classificacao-treino";
import type { Categoria } from "@/rules/types";
import { excluirTreino, sair } from "./actions";
import { TreinoForm } from "./treino-form";

interface Treino {
  id: string;
  data: string;
  tipo: TipoTreino;
  duracao_min: number;
  distancia_km: number | null;
  intensidade: Intensidade;
  categoria: Categoria;
  planejado: boolean;
}

function CardDia({ titulo, dia, treinos }: { titulo: string; dia: "hoje" | "amanha"; treinos: Treino[] }) {
  const categoria = categoriaDoDia(treinos.map((t) => t.categoria));
  return (
    <section>
      <h2>
        {titulo}: {ROTULO_CATEGORIA[categoria]}
      </h2>
      <ul>
        {treinos.map((t) => (
          <li key={t.id}>
            {ROTULO_TIPO[t.tipo]} · {t.duracao_min} min
            {t.distancia_km ? ` · ${t.distancia_km} km` : ""} · {ROTULO_INTENSIDADE[t.intensidade]} ·{" "}
            {ROTULO_CATEGORIA[t.categoria]}
            {t.planejado ? " (planejado)" : ""}
            <form action={excluirTreino} style={{ display: "inline" }}>
              <input type="hidden" name="id" value={t.id} />
              <button aria-label="Remover treino">×</button>
            </form>
          </li>
        ))}
      </ul>
      <TreinoForm dia={dia} />
    </section>
  );
}

export default async function Hoje() {
  const { supabase, user } = await usuarioAtual();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!perfil) redirect("/onboarding");

  const hoje = dataLocal();
  const amanha = somarDias(hoje, 1);
  const { data } = await supabase
    .from("workouts")
    .select("id, data, tipo, duracao_min, distancia_km, intensidade, categoria, planejado")
    .eq("user_id", user.id)
    .in("data", [hoje, amanha])
    .order("criado_em");
  const treinos = (data ?? []) as Treino[];

  return (
    <>
      <h1>Hoje</h1>
      <CardDia titulo="Hoje" dia="hoje" treinos={treinos.filter((t) => t.data === hoje)} />
      <CardDia titulo="Amanhã" dia="amanha" treinos={treinos.filter((t) => t.data === amanha)} />
      <p>
        <Link href="/analisar">Analisar cardápio</Link>
      </p>
      <p>
        <Link href="/corpo">Corpo</Link> · <Link href="/onboarding">Perfil</Link>
      </p>
      <form action={sair}>
        <button>Sair</button>
      </form>
    </>
  );
}
