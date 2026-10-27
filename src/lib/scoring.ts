/**
 * Aplica as regras de `src/rules/nutrition-rules.ts` aos itens extraídos do cardápio.
 * Toda decisão de selo sai daqui — nunca do modelo de IA.
 */
import {
  AJUSTES,
  ALCOOL,
  CATEGORIAS_QUE_PEDEM_VESPERA,
  LIMIARES,
  META_PROTEINA,
  MODIFICADORES,
  PESOS,
  REGRAS,
  RESTRICOES_TAGS,
} from "@/rules/nutrition-rules";
import type {
  Categoria,
  Faixa,
  Momento,
  Nivel,
  Objetivo,
  Prioridades,
  Restricao,
  Selo,
  Tag,
} from "@/rules/types";
import type { ItemCardapio } from "./menu-schema";

export interface ContextoDia {
  objetivo: Objetivo;
  categoriaHoje: Categoria;
  categoriaAmanha?: Categoria;
  momento: Momento;
  /** Álcool planejado para hoje ou consumido ontem. */
  alcool?: { doses: number; quando: "hoje" | "ontem" };
  restricoes?: Restricao[];
  /** Dados corporais mais recentes, para personalizar a meta de proteína. */
  corpo?: ReferenciaCorporal;
}

export interface ReferenciaCorporal {
  pesoKg?: number | null;
  massaMagraKg?: number | null;
}

export interface RegraEfetiva {
  prioridades: Prioridades;
  /** Meta de proteína desta refeição, em gramas. */
  metaProteinaG: number;
  favorecer: Set<Tag>;
  evitar: Set<Tag>;
  notas: string[];
}

export interface ItemAvaliado {
  item: ItemCardapio;
  selo: Selo;
  pontos: number;
  razoes: string[];
  ajustes: string[];
  /** Preço final por grama de proteína (R$/g), como faixa. */
  custoPorGramaProteina: Faixa | null;
}

export interface ResultadoAnalise {
  ranking: ItemAvaliado[];
  /** Itens que não recebem selo (ex.: bebidas alcoólicas). */
  foraDoRanking: ItemCardapio[];
  notas: string[];
  avisos: string[];
}

const NIVEIS: Nivel[] = ["baixo", "moderado", "alto"];
const CONFIANCA_BAIXA = 0.5;

/** Meta de proteína por refeição: massa magra > peso > valor fixo, dentro dos limites. */
export function metaProteinaG(prioridade: Prioridades["proteina"], corpo?: ReferenciaCorporal): number {
  let meta: number;
  if (corpo?.massaMagraKg) meta = corpo.massaMagraKg * META_PROTEINA.porKgMassaMagra[prioridade];
  else if (corpo?.pesoKg) meta = corpo.pesoKg * META_PROTEINA.porKgPeso[prioridade];
  else return META_PROTEINA.fixaG[prioridade];
  const { min, max } = META_PROTEINA.limitesG;
  return Math.round(Math.min(max, Math.max(min, meta)));
}

export function regraEfetiva(ctx: ContextoDia): RegraEfetiva {
  const base = REGRAS[ctx.categoriaHoje][ctx.objetivo];
  const modificadores = [];
  if (ctx.categoriaAmanha && CATEGORIAS_QUE_PEDEM_VESPERA.includes(ctx.categoriaAmanha)) {
    modificadores.push(MODIFICADORES.vespera);
  }
  if (ctx.categoriaHoje !== "descanso") {
    if (ctx.momento === "pre_treino") modificadores.push(MODIFICADORES.pre_treino);
    if (ctx.momento === "pos_treino") modificadores.push(MODIFICADORES.pos_treino);
  }
  if (ctx.alcool && ctx.alcool.doses > 0) modificadores.push(MODIFICADORES.alcool);

  let { carboidrato, proteina } = base.prioridades;
  const favorecer = new Set<Tag>(base.favorecer);
  const evitar = new Set<Tag>(base.evitar);
  const notas = [base.nota];
  for (const m of modificadores) {
    if ("elevarCarboidrato" in m && m.elevarCarboidrato) {
      carboidrato = NIVEIS[Math.min(NIVEIS.indexOf(carboidrato) + 1, NIVEIS.length - 1)];
    }
    if ("priorizarProteina" in m && m.priorizarProteina) proteina = "alto";
    m.favorecer.forEach((t) => favorecer.add(t));
    m.evitar.forEach((t) => evitar.add(t));
    notas.push(m.nota);
  }
  // Em conflito, "evitar" prevalece (postura conservadora).
  evitar.forEach((t) => favorecer.delete(t));

  return {
    prioridades: { ...base.prioridades, carboidrato, proteina },
    metaProteinaG: metaProteinaG(proteina, ctx.corpo),
    favorecer,
    evitar,
    notas,
  };
}

function nivelCarboidrato(tags: Tag[]): Nivel | undefined {
  if (tags.includes("carboidrato_alto")) return "alto";
  if (tags.includes("carboidrato_moderado")) return "moderado";
  if (tags.includes("carboidrato_baixo")) return "baixo";
  return undefined;
}

export function custoPorGramaProteina(item: ItemCardapio): Faixa | null {
  const p = item.proteina_g_estimada;
  if (item.preco === undefined || !p || p.min <= 0) return null;
  return { min: item.preco / p.max, max: item.preco / p.min };
}

export function avaliarItem(item: ItemCardapio, regra: RegraEfetiva, restricoes: Restricao[] = []): ItemAvaliado {
  const razoes: string[] = [];
  const ajustes = new Set<string>();
  const custo = custoPorGramaProteina(item);

  for (const r of restricoes) {
    const conflito = RESTRICOES_TAGS[r].filter((t) => item.tags.includes(t));
    if (conflito.length > 0) {
      return {
        item,
        selo: "evite",
        pontos: -Infinity,
        razoes: [`Contém ${conflito.join(", ")}, incompatível com sua restrição (${r}).`],
        ajustes: [],
        custoPorGramaProteina: custo,
      };
    }
  }

  const { prioridades } = regra;
  let pontos = 0;

  const carbItem = nivelCarboidrato(item.tags);
  if (carbItem) {
    const distancia = Math.abs(NIVEIS.indexOf(carbItem) - NIVEIS.indexOf(prioridades.carboidrato));
    if (distancia === 0) {
      pontos += PESOS.carboidratoIgual;
      razoes.push(`Carboidrato ${carbItem}, como o dia pede.`);
    } else if (distancia === 1 && NIVEIS.indexOf(carbItem) > NIVEIS.indexOf(prioridades.carboidrato)) {
      pontos += PESOS.carboidratoUmNivelAcima;
      razoes.push(`Carboidrato um pouco acima do que o dia pede (${prioridades.carboidrato}).`);
    } else if (distancia === 2) {
      pontos += PESOS.carboidratoOposto;
      razoes.push(`Carboidrato ${carbItem}; hoje o ideal é ${prioridades.carboidrato}.`);
      const ajuste = AJUSTES[carbItem === "alto" ? "carboidrato_alto" : "carboidrato_baixo"];
      if (ajuste) ajustes.add(ajuste);
    }
  }

  const proteina = item.proteina_g_estimada;
  if (!proteina && item.tags.includes("proteina_alta")) {
    pontos += PESOS.proteinaAtingeMeta;
    razoes.push("Boa fonte de proteína.");
  } else if (proteina) {
    const meta = regra.metaProteinaG;
    const media = (proteina.min + proteina.max) / 2;
    if (media >= meta) {
      pontos += PESOS.proteinaAtingeMeta;
      razoes.push(`Boa proteína (~${proteina.min}–${proteina.max} g).`);
    } else if (media < meta * 0.6) {
      pontos += PESOS.proteinaMuitoAbaixo;
      razoes.push(`Pouca proteína (~${proteina.min}–${proteina.max} g) para a meta de ~${meta} g.`);
    }
  }

  if (item.tags.includes("gordura_alta") && !regra.evitar.has("gordura_alta")) {
    if (prioridades.gordura === "baixo") pontos += PESOS.gorduraAltaComPrioridadeBaixa;
    else pontos += PESOS.gorduraAltaComPrioridadeModerada;
    razoes.push("Rico em gordura.");
    if (AJUSTES.gordura_alta) ajustes.add(AJUSTES.gordura_alta);
  }

  const favorecidas = item.tags.filter((t) => regra.favorecer.has(t));
  const evitadas = item.tags.filter((t) => regra.evitar.has(t));
  pontos += favorecidas.length * PESOS.tagFavorecida + evitadas.length * PESOS.tagEvitada;
  if (favorecidas.length > 0) razoes.push(`A favor: ${favorecidas.join(", ")}.`);
  if (evitadas.length > 0) razoes.push(`Contra: ${evitadas.join(", ")}.`);
  for (const t of evitadas) {
    const ajuste = AJUSTES[t];
    if (ajuste) ajustes.add(ajuste);
  }

  if (item.confianca < CONFIANCA_BAIXA) {
    razoes.push("Estimativa com baixa confiança — confira a porção e os ingredientes.");
  }

  const selo: Selo = pontos >= LIMIARES.ideal ? "ideal" : pontos >= LIMIARES.serve ? "serve" : "evite";
  return { item, selo, pontos, razoes, ajustes: [...ajustes], custoPorGramaProteina: custo };
}

export function avisosDoDia(ctx: ContextoDia): string[] {
  const avisos: string[] = [];
  if (!ctx.alcool || ctx.alcool.doses <= 0) return avisos;
  if (ctx.alcool.quando === "ontem" && ALCOOL.categoriasPesadas.includes(ctx.categoriaHoje)) {
    avisos.push(ALCOOL.avisoBebeuOntemTreinoPesado);
  }
  avisos.push(ALCOOL.avisoHidratacao);
  if (ctx.alcool.doses >= ALCOOL.dosesAvisoCuidado) avisos.push(ALCOOL.avisoCuidado);
  return avisos;
}

function custoMedio(a: ItemAvaliado): number {
  const c = a.custoPorGramaProteina;
  return c ? (c.min + c.max) / 2 : Infinity;
}

export function analisarCardapio(itens: ItemCardapio[], ctx: ContextoDia): ResultadoAnalise {
  const regra = regraEfetiva(ctx);
  const foraDoRanking = itens.filter(
    (i) => ALCOOL.bebidaAlcoolicaForaDoRanking && i.tags.includes("bebida_alcoolica"),
  );
  const ranking = itens
    .filter((i) => !foraDoRanking.includes(i))
    .map((i) => avaliarItem(i, regra, ctx.restricoes))
    .sort((a, b) => b.pontos - a.pontos || custoMedio(a) - custoMedio(b));

  return { ranking, foraDoRanking, notas: regra.notas, avisos: avisosDoDia(ctx) };
}
