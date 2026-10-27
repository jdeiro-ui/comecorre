import { z } from "zod";

/** Medidas de bioimpedância que o app guarda. Todas opcionais: cada balança mostra um conjunto. */
export const CAMPOS_BIO = {
  peso_kg: { rotulo: "Peso", unidade: "kg", min: 20, max: 400 },
  imc: { rotulo: "IMC", unidade: "", min: 8, max: 80 },
  gordura_pct: { rotulo: "Gordura corporal", unidade: "%", min: 1, max: 75 },
  gordura_subcutanea_pct: { rotulo: "Gordura subcutânea", unidade: "%", min: 1, max: 75 },
  gordura_visceral: { rotulo: "Gordura visceral (nível)", unidade: "", min: 1, max: 60 },
  massa_muscular_kg: { rotulo: "Massa muscular", unidade: "kg", min: 5, max: 200 },
  musculo_esqueletico_pct: { rotulo: "Músculo esquelético", unidade: "%", min: 5, max: 80 },
  massa_ossea_kg: { rotulo: "Massa óssea", unidade: "kg", min: 0.5, max: 10 },
  massa_magra_kg: { rotulo: "Massa magra (peso sem gordura)", unidade: "kg", min: 10, max: 250 },
  idade_metabolica: { rotulo: "Idade metabólica", unidade: "anos", min: 10, max: 120 },
  tmb_kcal: { rotulo: "Taxa metabólica basal", unidade: "kcal", min: 500, max: 5000 },
  agua_pct: { rotulo: "Água corporal", unidade: "%", min: 20, max: 80 },
  proteina_pct: { rotulo: "Proteína", unidade: "%", min: 5, max: 40 },
} as const;
export type CampoBio = keyof typeof CAMPOS_BIO;
export const NOMES_CAMPOS_BIO = Object.keys(CAMPOS_BIO) as CampoBio[];

/**
 * Formato pedido ao modelo (structured output). Sem faixas aqui: o modelo só transcreve;
 * a validação de faixa acontece na confirmação pelo usuário.
 */
export const extracaoBioSchema = z.object({
  e_bioimpedancia: z.boolean().describe("A imagem é um resultado de balança de bioimpedância?"),
  data_medicao: z.string().nullable().describe("Data da medição em YYYY-MM-DD, se visível; senão null"),
  medidas: z.object(
    Object.fromEntries(
      NOMES_CAMPOS_BIO.map((c) => [
        c,
        z.number().nullable().describe(`${CAMPOS_BIO[c].rotulo}${CAMPOS_BIO[c].unidade ? ` (${CAMPOS_BIO[c].unidade})` : ""}`),
      ]),
    ) as Record<CampoBio, z.ZodNullable<z.ZodNumber>>,
  ),
});
export type ExtracaoBio = z.infer<typeof extracaoBioSchema>;
