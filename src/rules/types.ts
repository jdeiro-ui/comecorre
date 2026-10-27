// Vocabulário compartilhado entre o motor de regras, a extração do cardápio e as telas.

export const OBJETIVOS = [
  "hipertrofia",
  "perda_peso",
  "manutencao",
  "performance_corrida",
] as const;
export type Objetivo = (typeof OBJETIVOS)[number];

export const CATEGORIAS = [
  "descanso",
  "leve",
  "qualidade",
  "longao",
  "forca",
  "duplo",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Momento da refeição em relação ao treino de hoje. */
export const MOMENTOS = ["pre_treino", "pos_treino", "outro"] as const;
export type Momento = (typeof MOMENTOS)[number];

/** Tags que a extração (IA) atribui a cada item do cardápio. */
export const TAGS = [
  // preparo
  "frito",
  "empanado",
  "grelhado",
  "assado",
  "cozido",
  "cru",
  // macronutrientes (estimativa qualitativa)
  "carboidrato_alto",
  "carboidrato_moderado",
  "carboidrato_baixo",
  "proteina_alta",
  "gordura_alta",
  // outros atributos
  "molho_cremoso",
  "acucar_alto",
  "sodio_alto",
  "fibra_alta",
  "vegetais",
  "ultraprocessado",
  "sobremesa",
  "bebida_acucarada",
  "bebida_alcoolica",
  // ingredientes relevantes para restrições
  "carne_vermelha",
  "frango",
  "peixe_frutos_do_mar",
  "ovo",
  "lactose",
  "gluten",
  "amendoim_castanhas",
] as const;
export type Tag = (typeof TAGS)[number];

export const RESTRICOES = [
  "vegetariano",
  "vegano",
  "sem_lactose",
  "sem_gluten",
  "sem_frutos_do_mar",
  "alergia_amendoim_castanhas",
] as const;
export type Restricao = (typeof RESTRICOES)[number];

export type Nivel = "baixo" | "moderado" | "alto";

export interface Prioridades {
  carboidrato: Nivel;
  proteina: Exclude<Nivel, "baixo">;
  gordura: Exclude<Nivel, "alto">;
}

/** Regra de uma combinação categoria × objetivo. */
export interface RegraBase {
  prioridades: Prioridades;
  favorecer: Tag[];
  evitar: Tag[];
  /** Justificativa em linguagem simples, exibível ao usuário. */
  nota: string;
}

/** Ajuste aplicado por cima da regra base (véspera, pré, pós, álcool). */
export interface Modificador {
  /** Sobe um nível na prioridade de carboidrato (baixo → moderado → alto). */
  elevarCarboidrato?: boolean;
  /** Força a prioridade de proteína para "alto". */
  priorizarProteina?: boolean;
  favorecer: Tag[];
  evitar: Tag[];
  nota: string;
}

export type Selo = "ideal" | "serve" | "evite";

export interface Faixa {
  min: number;
  max: number;
}
