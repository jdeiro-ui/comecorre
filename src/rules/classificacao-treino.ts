/**
 * Limiares para classificar um treino em categoria de demanda (SPEC §5).
 * Arquivo de regras: valores revisáveis, sem lógica.
 */
import type { Categoria } from "./types";

export const TIPOS_TREINO = ["corrida", "musculacao", "caminhada", "mobilidade", "outro_cardio"] as const;
export type TipoTreino = (typeof TIPOS_TREINO)[number];

export const INTENSIDADES = ["leve", "moderada", "forte"] as const;
export type Intensidade = (typeof INTENSIDADES)[number];

export const LIMIARES_TREINO = {
  /** Corrida é longão a partir de qualquer um destes. */
  longaoMinutos: 90,
  longaoKm: 18,
  /** Outros cardios (bike, natação…) contam como longão a partir desta duração. */
  outroCardioLongaoMinutos: 120,
} as const;

/** Tipos que, em qualquer intensidade, são sempre treino leve. */
export const TIPOS_SEMPRE_LEVES: TipoTreino[] = ["caminhada", "mobilidade"];

/**
 * Para cada tipo, a categoria de cada intensidade. Um array indica que a combinação
 * é ambígua: perguntar ao usuário entre as opções (a primeira é a sugestão).
 */
export const CATEGORIA_POR_INTENSIDADE: Record<
  Exclude<TipoTreino, "caminhada" | "mobilidade">,
  Record<Intensidade, Categoria | Categoria[]>
> = {
  corrida: { leve: "leve", moderada: ["leve", "qualidade"], forte: "qualidade" },
  musculacao: { leve: "leve", moderada: ["forca", "leve"], forte: "forca" },
  outro_cardio: { leve: "leve", moderada: ["leve", "qualidade"], forte: "qualidade" },
};
