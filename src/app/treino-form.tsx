"use client";

import { useActionState } from "react";
import { ROTULO_CATEGORIA, ROTULO_INTENSIDADE, ROTULO_TIPO } from "@/lib/rotulos";
import { INTENSIDADES, TIPOS_TREINO } from "@/rules/classificacao-treino";
import { salvarTreino, type EstadoTreino } from "./actions";

/** Entrada manual rápida: tipo, duração, intensidade (distância opcional). */
export function TreinoForm({ dia }: { dia: "hoje" | "amanha" }) {
  const [estado, acao, pendente] = useActionState<EstadoTreino, FormData>(salvarTreino, {});
  const v = estado.valores ?? {};

  return (
    // `key` remonta o formulário com os valores enviados quando precisamos perguntar algo.
    <form action={acao} key={JSON.stringify(v)}>
      <input type="hidden" name="dia" value={dia} />
      <select name="tipo" defaultValue={v.tipo ?? ""} required>
        <option value="" disabled>
          Tipo
        </option>
        {TIPOS_TREINO.map((t) => (
          <option key={t} value={t}>
            {ROTULO_TIPO[t]}
          </option>
        ))}
      </select>
      <input name="duracaoMin" type="number" inputMode="numeric" min={1} placeholder="Minutos" defaultValue={v.duracaoMin} required />
      <input name="distanciaKm" type="number" inputMode="decimal" step="0.1" min={0} placeholder="Km (opcional)" defaultValue={v.distanciaKm} />
      <fieldset>
        {INTENSIDADES.map((i) => (
          <label key={i}>
            <input type="radio" name="intensidade" value={i} defaultChecked={v.intensidade === i} required />
            {ROTULO_INTENSIDADE[i]}
          </label>
        ))}
      </fieldset>
      {dia === "hoje" && (
        <label>
          <input type="checkbox" name="planejado" defaultChecked={v.planejado === "on"} /> Ainda vou fazer
        </label>
      )}

      {estado.pergunta && (
        <fieldset>
          <legend>Como foi esse treino?</legend>
          {estado.pergunta.map((c, i) => (
            <label key={c}>
              <input type="radio" name="categoria" value={c} defaultChecked={i === 0} />
              {ROTULO_CATEGORIA[c]}
            </label>
          ))}
        </fieldset>
      )}

      {estado.erro && <p role="alert">{estado.erro}</p>}
      <button disabled={pendente}>{estado.pergunta ? "Confirmar" : "Adicionar"}</button>
    </form>
  );
}
