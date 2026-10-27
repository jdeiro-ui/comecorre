"use client";

import { useActionState } from "react";
import { CAMPOS_BIO, NOMES_CAMPOS_BIO } from "@/lib/bio-schema";
import { lerPrint, preencherManual, salvarMedidas, type EstadoBio } from "./actions";

async function despachar(estado: EstadoBio, fd: FormData): Promise<EstadoBio> {
  switch (fd.get("acao")) {
    case "ler":
      return lerPrint(estado, fd);
    case "manual":
      return preencherManual();
    case "cancelar":
      return { etapa: "envio" };
    default:
      return salvarMedidas(estado, fd);
  }
}

export function BioForm({ hoje }: { hoje: string }) {
  const [estado, acao, pendente] = useActionState<EstadoBio, FormData>(despachar, { etapa: "envio" });

  if (estado.etapa === "envio") {
    return (
      <form action={acao}>
        <label>
          Print da balança
          <input name="print" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>
        <p className="aviso">O print é lido e descartado; guardamos só os números que você confirmar.</p>
        {estado.erro && <p role="alert">{estado.erro}</p>}
        <button name="acao" value="ler" disabled={pendente}>
          {pendente ? "Lendo…" : "Ler print"}
        </button>
        <button name="acao" value="manual" disabled={pendente} formNoValidate>
          Preencher manualmente
        </button>
      </form>
    );
  }

  const v = estado.valores ?? {};
  return (
    <form action={acao} key={JSON.stringify(v)}>
      <input type="hidden" name="fonte" value={estado.fonte} />
      {estado.fonte === "print" && <p>Confira os valores lidos e corrija o que estiver errado.</p>}
      <label>
        Data da medição <input name="medido_em" type="date" max={hoje} defaultValue={v.medido_em ?? hoje} required />
      </label>
      {NOMES_CAMPOS_BIO.map((c) => (
        <label key={c}>
          {CAMPOS_BIO[c].rotulo}
          {CAMPOS_BIO[c].unidade && ` (${CAMPOS_BIO[c].unidade})`}
          <input name={c} type="number" step="any" inputMode="decimal" defaultValue={v[c] ?? ""} />
        </label>
      ))}
      {estado.erro && <p role="alert">{estado.erro}</p>}
      <button name="acao" value="salvar" disabled={pendente}>
        Salvar
      </button>
      <button name="acao" value="cancelar" disabled={pendente} formNoValidate>
        Cancelar
      </button>
    </form>
  );
}
