import type { Intensidade, TipoTreino } from "@/rules/classificacao-treino";
import type { Categoria, Objetivo, Restricao } from "@/rules/types";

export const ROTULO_OBJETIVO: Record<Objetivo, string> = {
  hipertrofia: "Ganhar massa muscular",
  perda_peso: "Perder peso",
  manutencao: "Manter",
  performance_corrida: "Performance na corrida",
};

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  descanso: "Descanso",
  leve: "Leve",
  qualidade: "Qualidade",
  longao: "Longão",
  forca: "Força",
  duplo: "Duplo",
};

export const ROTULO_TIPO: Record<TipoTreino, string> = {
  corrida: "Corrida",
  musculacao: "Musculação",
  caminhada: "Caminhada",
  mobilidade: "Mobilidade",
  outro_cardio: "Outro cardio",
};

export const ROTULO_INTENSIDADE: Record<Intensidade, string> = {
  leve: "Leve",
  moderada: "Moderada",
  forte: "Forte",
};

export const ROTULO_RESTRICAO: Record<Restricao, string> = {
  vegetariano: "Vegetariano",
  vegano: "Vegano",
  sem_lactose: "Sem lactose",
  sem_gluten: "Sem glúten",
  sem_frutos_do_mar: "Sem frutos do mar",
  alergia_amendoim_castanhas: "Alergia a amendoim/castanhas",
};
