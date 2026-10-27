/**
 * Regras de recomendação — arquivo único, pensado para revisão por nutricionista.
 *
 * O modelo de IA apenas extrai e estima os itens do cardápio. Quem decide o selo
 * (ideal / serve / evite) é o código em `src/lib/scoring.ts`, usando SÓ o que está aqui.
 *
 * TODO humano: regras iniciais genéricas. Validar com nutricionista esportivo antes de lançar.
 */
import type {
  Categoria,
  Modificador,
  Objetivo,
  RegraBase,
  Restricao,
  Selo,
  Tag,
} from "./types";

// ---------------------------------------------------------------------------
// 1. Tabela categoria × objetivo
// ---------------------------------------------------------------------------

export const REGRAS: Record<Categoria, Record<Objetivo, RegraBase>> = {
  descanso: {
    hipertrofia: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "moderado" },
      favorecer: ["grelhado", "assado", "vegetais"],
      evitar: ["frito", "empanado", "acucar_alto", "bebida_acucarada"],
      nota: "Dia sem treino: a proteína segue importante para a recuperação muscular; carboidrato pode ser moderado.",
    },
    perda_peso: {
      prioridades: { carboidrato: "baixo", proteina: "alto", gordura: "baixo" },
      favorecer: ["grelhado", "vegetais", "fibra_alta"],
      evitar: ["frito", "empanado", "molho_cremoso", "acucar_alto", "bebida_acucarada", "ultraprocessado"],
      nota: "Dia sem treino: pratos com proteína e vegetais saciam mais com menos energia.",
    },
    manutencao: {
      prioridades: { carboidrato: "moderado", proteina: "moderado", gordura: "moderado" },
      favorecer: ["vegetais", "grelhado", "assado"],
      evitar: ["frito", "empanado", "acucar_alto", "ultraprocessado"],
      nota: "Dia sem treino: prato equilibrado, sem necessidade de reforço de carboidrato.",
    },
    performance_corrida: {
      prioridades: { carboidrato: "moderado", proteina: "moderado", gordura: "moderado" },
      favorecer: ["vegetais", "fibra_alta", "grelhado"],
      evitar: ["frito", "empanado", "ultraprocessado", "bebida_acucarada"],
      nota: "Dia de descanso: bom momento para comida de verdade, vegetais e fibras.",
    },
  },

  leve: {
    hipertrofia: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "moderado" },
      favorecer: ["grelhado", "assado", "vegetais"],
      evitar: ["frito", "empanado", "acucar_alto"],
      nota: "Treino leve gasta pouco: mantenha a proteína alta e o carboidrato moderado.",
    },
    perda_peso: {
      prioridades: { carboidrato: "baixo", proteina: "alto", gordura: "baixo" },
      favorecer: ["grelhado", "vegetais", "fibra_alta"],
      evitar: ["frito", "empanado", "molho_cremoso", "acucar_alto", "bebida_acucarada"],
      nota: "Treino leve não pede reforço de carboidrato; priorize proteína e vegetais.",
    },
    manutencao: {
      prioridades: { carboidrato: "moderado", proteina: "moderado", gordura: "moderado" },
      favorecer: ["vegetais", "grelhado", "assado"],
      evitar: ["frito", "empanado", "acucar_alto"],
      nota: "Treino leve: prato equilibrado atende bem.",
    },
    performance_corrida: {
      prioridades: { carboidrato: "moderado", proteina: "moderado", gordura: "moderado" },
      favorecer: ["vegetais", "grelhado", "cozido"],
      evitar: ["frito", "empanado", "ultraprocessado"],
      nota: "Regenerativo: carboidrato moderado e boa variedade de vegetais.",
    },
  },

  qualidade: {
    hipertrofia: {
      prioridades: { carboidrato: "alto", proteina: "alto", gordura: "moderado" },
      favorecer: ["grelhado", "cozido"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Treino intenso consome glicogênio: carboidrato alto e proteína alta.",
    },
    perda_peso: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "baixo" },
      favorecer: ["grelhado", "cozido", "vegetais"],
      evitar: ["frito", "empanado", "molho_cremoso", "acucar_alto"],
      nota: "Mesmo buscando perder peso, treino intenso pede algum carboidrato para render e recuperar.",
    },
    manutencao: {
      prioridades: { carboidrato: "moderado", proteina: "moderado", gordura: "moderado" },
      favorecer: ["grelhado", "cozido", "vegetais"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Treino intenso: inclua uma boa porção de carboidrato e proteína.",
    },
    performance_corrida: {
      prioridades: { carboidrato: "alto", proteina: "moderado", gordura: "baixo" },
      favorecer: ["cozido", "grelhado"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Dia de qualidade: carboidrato alto para repor glicogênio, gordura baixa para digerir bem.",
    },
  },

  longao: {
    hipertrofia: {
      prioridades: { carboidrato: "alto", proteina: "alto", gordura: "moderado" },
      favorecer: ["cozido", "grelhado"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Longão gasta muita energia: carboidrato alto e proteína alta para não perder massa.",
    },
    perda_peso: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "baixo" },
      favorecer: ["cozido", "grelhado", "vegetais"],
      evitar: ["frito", "empanado", "molho_cremoso", "acucar_alto"],
      nota: "Longão: comer pouco demais atrapalha a recuperação, mesmo com objetivo de perder peso.",
    },
    manutencao: {
      prioridades: { carboidrato: "alto", proteina: "moderado", gordura: "moderado" },
      favorecer: ["cozido", "grelhado"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Longão: priorize carboidrato para repor energia.",
    },
    performance_corrida: {
      prioridades: { carboidrato: "alto", proteina: "moderado", gordura: "baixo" },
      favorecer: ["cozido", "grelhado"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Longão: carboidrato alto é a prioridade, com proteína para recuperar.",
    },
  },

  forca: {
    hipertrofia: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "moderado" },
      favorecer: ["grelhado", "assado", "ovo"],
      evitar: ["frito", "empanado", "acucar_alto"],
      nota: "Musculação pesada: proteína alta é a prioridade, com carboidrato moderado.",
    },
    perda_peso: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "baixo" },
      favorecer: ["grelhado", "vegetais"],
      evitar: ["frito", "empanado", "molho_cremoso", "acucar_alto"],
      nota: "Musculação ajuda a preservar massa magra: proteína alta e carboidrato moderado.",
    },
    manutencao: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "moderado" },
      favorecer: ["grelhado", "assado"],
      evitar: ["frito", "empanado", "acucar_alto"],
      nota: "Dia de força: capriche na proteína.",
    },
    performance_corrida: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "moderado" },
      favorecer: ["grelhado", "vegetais"],
      evitar: ["frito", "empanado", "ultraprocessado"],
      nota: "Força complementa a corrida: proteína alta para recuperar.",
    },
  },

  duplo: {
    hipertrofia: {
      prioridades: { carboidrato: "alto", proteina: "alto", gordura: "moderado" },
      favorecer: ["cozido", "grelhado"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Dois treinos: demanda alta de energia e proteína.",
    },
    perda_peso: {
      prioridades: { carboidrato: "moderado", proteina: "alto", gordura: "baixo" },
      favorecer: ["cozido", "grelhado", "vegetais"],
      evitar: ["frito", "empanado", "molho_cremoso", "acucar_alto"],
      nota: "Dois treinos: não corte demais, a recuperação depende de energia suficiente.",
    },
    manutencao: {
      prioridades: { carboidrato: "alto", proteina: "moderado", gordura: "moderado" },
      favorecer: ["cozido", "grelhado"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Dois treinos: carboidrato alto para dar conta do dia.",
    },
    performance_corrida: {
      prioridades: { carboidrato: "alto", proteina: "moderado", gordura: "baixo" },
      favorecer: ["cozido", "grelhado"],
      evitar: ["frito", "empanado", "molho_cremoso"],
      nota: "Dois treinos: carboidrato alto e refeições fáceis de digerir.",
    },
  },
};

// ---------------------------------------------------------------------------
// 2. Modificadores (aplicados por cima da regra base)
// ---------------------------------------------------------------------------

/** Categorias de amanhã que pedem reforço de carboidrato na véspera. */
export const CATEGORIAS_QUE_PEDEM_VESPERA: Categoria[] = ["longao", "qualidade"];

export const MODIFICADORES = {
  vespera: {
    elevarCarboidrato: true,
    favorecer: ["cozido"],
    evitar: ["frito", "empanado", "gordura_alta", "molho_cremoso"],
    nota: "Amanhã tem treino forte: carboidrato hoje ajuda a chegar com energia; gordura em excesso pesa na digestão.",
  },
  pre_treino: {
    favorecer: ["carboidrato_moderado", "cozido"],
    evitar: ["frito", "empanado", "gordura_alta", "fibra_alta", "molho_cremoso"],
    nota: "Antes de treinar: prefira algo leve, com carboidrato e pouca gordura e fibra.",
  },
  pos_treino: {
    favorecer: ["carboidrato_moderado", "carboidrato_alto"],
    evitar: [],
    nota: "Depois do treino: proteína para recuperar e carboidrato para repor energia.",
  },
  alcool: {
    priorizarProteina: true,
    favorecer: ["carboidrato_moderado", "vegetais"],
    evitar: ["gordura_alta", "frito", "molho_cremoso", "sodio_alto"],
    nota: "Com álcool no dia: refeição com proteína e carboidrato, menos gordura e sal; beba água ao longo do dia.",
  },
} satisfies Record<string, Modificador>;

// ---------------------------------------------------------------------------
// 3. Pontuação — como as prioridades e tags viram selo
// ---------------------------------------------------------------------------

export const PESOS = {
  /** Item com nível de carboidrato igual ao pedido. */
  carboidratoIgual: 2,
  /** Item com nível oposto (alto quando se pede baixo, ou vice-versa). */
  carboidratoOposto: -2,
  /** Item um nível acima do pedido (ex.: alto quando se pede moderado). Um nível abaixo vale 0. */
  carboidratoUmNivelAcima: -1,
  /** Proteína estimada (ponto médio) atinge a meta da refeição; sem estimativa, vale a tag `proteina_alta`. */
  proteinaAtingeMeta: 2,
  /** Proteína estimada abaixo de 60% da meta. */
  proteinaMuitoAbaixo: -2,
  /** `gordura_alta` quando a prioridade de gordura é baixa / moderada. */
  gorduraAltaComPrioridadeBaixa: -2,
  gorduraAltaComPrioridadeModerada: -1,
  /** Cada tag em `favorecer` / `evitar` (base + modificadores, sem contar repetidas). */
  tagFavorecida: 1,
  tagEvitada: -2,
} as const;

/**
 * Meta de proteína por refeição (gramas), conforme a prioridade de proteína do dia.
 * Usa a melhor referência corporal disponível: massa magra (bioimpedância) > peso > valor fixo.
 */
export const META_PROTEINA = {
  /** g por kg de massa magra, por refeição. */
  porKgMassaMagra: { moderado: 0.3, alto: 0.45 },
  /** g por kg de peso corporal, por refeição. */
  porKgPeso: { moderado: 0.25, alto: 0.4 },
  /** Sem dados corporais. */
  fixaG: { moderado: 20, alto: 30 },
  /** Limites da meta por refeição, para evitar valores extremos. */
  limitesG: { min: 15, max: 45 },
} as const;

/** Pontuação mínima para cada selo. Abaixo de `serve` → `evite`. */
export const LIMIARES: Record<Exclude<Selo, "evite">, number> = {
  ideal: 3,
  serve: 0,
};

// ---------------------------------------------------------------------------
// 4. Ajustes sugeridos ("peça sem…") por tag
// ---------------------------------------------------------------------------

export const AJUSTES: Partial<Record<Tag, string>> = {
  frito: "Se houver, peça a versão grelhada ou assada.",
  empanado: "Se possível, peça sem empanar.",
  molho_cremoso: "Peça o molho à parte e use pouco.",
  gordura_alta: "Retire coberturas como batata palha, bacon ou queijo extra.",
  carboidrato_alto: "Se quiser menos carboidrato, peça meia porção do acompanhamento.",
  carboidrato_baixo: "Se precisar de mais carboidrato, adicione arroz, batata ou pão.",
  acucar_alto: "Divida a porção ou deixe para outro momento.",
  bebida_acucarada: "Troque por água, água com gás ou versão zero.",
  sodio_alto: "Evite sal extra e capriche na água.",
};

// ---------------------------------------------------------------------------
// 5. Restrições alimentares → tags incompatíveis
// ---------------------------------------------------------------------------

export const RESTRICOES_TAGS: Record<Restricao, Tag[]> = {
  vegetariano: ["carne_vermelha", "frango", "peixe_frutos_do_mar"],
  vegano: ["carne_vermelha", "frango", "peixe_frutos_do_mar", "ovo", "lactose"],
  sem_lactose: ["lactose"],
  sem_gluten: ["gluten"],
  sem_frutos_do_mar: ["peixe_frutos_do_mar"],
  alergia_amendoim_castanhas: ["amendoim_castanhas"],
};

// ---------------------------------------------------------------------------
// 6. Álcool — avisos do dia (tom sem julgamento, nunca incentivar consumo)
// ---------------------------------------------------------------------------

export const ALCOOL = {
  /** Bebidas alcoólicas do cardápio não entram no ranking nem recebem selo. */
  bebidaAlcoolicaForaDoRanking: true,
  /** Categorias de hoje para as quais se sugere trocar por treino leve se bebeu ontem. */
  categoriasPesadas: ["qualidade", "longao", "duplo", "forca"] as Categoria[],
  avisoBebeuOntemTreinoPesado:
    "Depois de uma noite com bebida, o corpo recupera melhor com um treino leve. Se der, considere trocar o treino de hoje.",
  avisoHidratacao: "Intercale água com as bebidas e mantenha a hidratação ao longo do dia.",
  /** A partir de quantas doses mostrar o aviso de cuidado. */
  dosesAvisoCuidado: 5,
  avisoCuidado:
    "Se o consumo de álcool tem sido frequente ou difícil de controlar, conversar com um profissional de saúde pode ajudar.",
} as const;
