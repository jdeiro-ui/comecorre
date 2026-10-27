import {
  CATEGORIA_POR_INTENSIDADE,
  LIMIARES_TREINO,
  TIPOS_SEMPRE_LEVES,
  type Intensidade,
  type TipoTreino,
} from "@/rules/classificacao-treino";
import type { Categoria } from "@/rules/types";

export interface DadosTreino {
  tipo: TipoTreino;
  duracaoMin: number;
  distanciaKm?: number;
  intensidade: Intensidade;
}

export type Classificacao =
  | { ambigua: false; categoria: Categoria }
  /** Perguntar ao usuário; `opcoes[0]` é a sugestão. */
  | { ambigua: true; opcoes: Categoria[] };

export function classificarTreino(t: DadosTreino): Classificacao {
  if (TIPOS_SEMPRE_LEVES.includes(t.tipo)) return { ambigua: false, categoria: "leve" };

  if (t.tipo === "corrida") {
    const longaoPorDuracao = t.duracaoMin >= LIMIARES_TREINO.longaoMinutos;
    const longaoPorDistancia = (t.distanciaKm ?? 0) >= LIMIARES_TREINO.longaoKm;
    if (longaoPorDuracao || longaoPorDistancia) return { ambigua: false, categoria: "longao" };
  }
  if (t.tipo === "outro_cardio" && t.duracaoMin >= LIMIARES_TREINO.outroCardioLongaoMinutos) {
    return { ambigua: false, categoria: "longao" };
  }

  const tabela = CATEGORIA_POR_INTENSIDADE[t.tipo as keyof typeof CATEGORIA_POR_INTENSIDADE];
  const c = tabela[t.intensidade];
  return Array.isArray(c) ? { ambigua: true, opcoes: c } : { ambigua: false, categoria: c };
}

/** Prioridade para escolher a categoria do dia quando há um único treino relevante. */
const PESO_CATEGORIA: Record<Categoria, number> = {
  descanso: 0,
  leve: 1,
  forca: 2,
  qualidade: 3,
  longao: 4,
  duplo: 5,
};

/**
 * Categoria do dia a partir das categorias (já confirmadas) dos treinos daquele dia.
 * Sem treino → descanso. Dois ou mais treinos não leves → duplo.
 * Treinos leves somados a um treino forte não fazem o dia virar duplo.
 */
export function categoriaDoDia(categorias: Categoria[]): Categoria {
  if (categorias.length === 0) return "descanso";
  const naoLeves = categorias.filter((c) => c !== "leve" && c !== "descanso");
  if (naoLeves.length >= 2) return "duplo";
  return categorias.reduce((a, b) => (PESO_CATEGORIA[b] > PESO_CATEGORIA[a] ? b : a));
}
