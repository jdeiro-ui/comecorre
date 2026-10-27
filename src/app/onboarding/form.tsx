"use client";

import { useActionState } from "react";
import { ROTULO_OBJETIVO, ROTULO_RESTRICAO } from "@/lib/rotulos";
import { OBJETIVOS, RESTRICOES, type Objetivo, type Restricao } from "@/rules/types";
import { salvarPerfil, type EstadoPerfil } from "./actions";

export interface PerfilInicial {
  objetivo?: Objetivo;
  peso_kg?: number | null;
  altura_cm?: number | null;
  idade?: number | null;
  restricoes: Restricao[];
  consentimento_saude: boolean;
  consentimento_alcool: boolean;
}

export function PerfilForm({ inicial }: { inicial: PerfilInicial }) {
  const [estado, acao, pendente] = useActionState<EstadoPerfil, FormData>(salvarPerfil, {});
  const erro = (campo: string) => estado.erros?.[campo] && <p role="alert">{estado.erros[campo]}</p>;

  return (
    <form action={acao}>
      <fieldset>
        <legend>Objetivo</legend>
        {OBJETIVOS.map((o) => (
          <label key={o}>
            <input type="radio" name="objetivo" value={o} defaultChecked={inicial.objetivo === o} required />
            {ROTULO_OBJETIVO[o]}
          </label>
        ))}
        {erro("objetivo")}
      </fieldset>

      <fieldset>
        <legend>Dados básicos (opcional)</legend>
        <label>
          Peso (kg) <input name="peso_kg" type="number" step="0.1" inputMode="decimal" defaultValue={inicial.peso_kg ?? ""} />
        </label>
        <label>
          Altura (cm) <input name="altura_cm" type="number" inputMode="numeric" defaultValue={inicial.altura_cm ?? ""} />
        </label>
        <label>
          Idade <input name="idade" type="number" inputMode="numeric" defaultValue={inicial.idade ?? ""} />
        </label>
        {erro("peso_kg")}
        {erro("altura_cm")}
        {erro("idade")}
      </fieldset>

      <fieldset>
        <legend>Restrições alimentares</legend>
        {RESTRICOES.map((r) => (
          <label key={r}>
            <input type="checkbox" name="restricoes" value={r} defaultChecked={inicial.restricoes.includes(r)} />
            {ROTULO_RESTRICAO[r]}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Strava</legend>
        <p className="aviso">Conexão com o Strava chega em breve. Por enquanto, registre os treinos manualmente.</p>
      </fieldset>

      <fieldset>
        <legend>Privacidade</legend>
        <label>
          <input type="checkbox" name="consentimento_saude" defaultChecked={inicial.consentimento_saude} required />
          Autorizo o uso dos meus dados de treino e saúde para gerar as sugestões.
        </label>
        {erro("consentimento_saude")}
        <label>
          <input type="checkbox" name="consentimento_alcool" defaultChecked={inicial.consentimento_alcool} />
          Quero poder registrar consumo de álcool (opcional). Desmarcar apaga esses registros.
        </label>
      </fieldset>

      {erro("geral")}
      <button disabled={pendente}>Salvar</button>
    </form>
  );
}
