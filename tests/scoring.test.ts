import { describe, expect, it } from "vitest";
import { analisarCardapio, avaliarItem, avisosDoDia, custoPorGramaProteina, regraEfetiva, type ContextoDia } from "@/lib/scoring";
import { extracaoCardapioSchema } from "@/lib/menu-schema";
import { REGRAS } from "@/rules/nutrition-rules";
import { CATEGORIAS, OBJETIVOS } from "@/rules/types";
import { CARDAPIO, PRATOS } from "./fixtures";

const ctx = (c: Partial<ContextoDia> = {}): ContextoDia => ({
  objetivo: "performance_corrida",
  categoriaHoje: "descanso",
  momento: "outro",
  ...c,
});

const seloDe = (nome: string, c: ContextoDia) =>
  analisarCardapio(CARDAPIO, c).ranking.find((a) => a.item.nome === nome)?.selo;

describe("tabela categoria × objetivo", () => {
  const combinacoes = CATEGORIAS.flatMap((categoria) => OBJETIVOS.map((objetivo) => [categoria, objetivo] as const));

  it("tem as 24 combinações", () => {
    expect(combinacoes).toHaveLength(24);
  });

  describe.each(combinacoes)("%s × %s", (categoria, objetivo) => {
    const regra = REGRAS[categoria][objetivo];
    const c = ctx({ categoriaHoje: categoria, objetivo });

    it("está definida, com nota e sem tag em favorecer e evitar ao mesmo tempo", () => {
      expect(regra.nota.length).toBeGreaterThan(10);
      expect(regra.favorecer.filter((t) => regra.evitar.includes(t))).toEqual([]);
    });

    it("prato grelhado com carboidrato moderado e legumes nunca é 'evite'", () => {
      expect(seloDe(PRATOS.grelhadoComArrozELegumes.nome, c)).not.toBe("evite");
    });

    it("fritura empanada com fritas é 'evite'", () => {
      expect(seloDe(PRATOS.parmegianaComFritas.nome, c)).toBe("evite");
    });

    it("refrigerante nunca é 'ideal'", () => {
      expect(seloDe(PRATOS.refrigerante.nome, c)).not.toBe("ideal");
    });

    it("prato de carboidrato alto e enxuto é 'ideal' sse o dia pede carboidrato alto", () => {
      const selo = seloDe(PRATOS.macarraoAoSugoComFrango.nome, c);
      if (regra.prioridades.carboidrato === "alto") expect(selo).toBe("ideal");
      else expect(selo).not.toBe("ideal");
    });
  });
});

describe("critério de aceite: o mesmo cardápio muda com o contexto", () => {
  it("longão amanhã vs descanso", () => {
    const descanso = analisarCardapio(CARDAPIO, ctx());
    const vespera = analisarCardapio(CARDAPIO, ctx({ categoriaAmanha: "longao" }));
    const macarrao = (r: typeof descanso) => r.ranking.find((a) => a.item.nome === PRATOS.macarraoAoSugoComFrango.nome)!;
    expect(macarrao(descanso).selo).toBe("serve");
    expect(macarrao(vespera).selo).toBe("ideal");
    expect(vespera.notas.some((n) => n.includes("Amanhã"))).toBe(true);
  });

  it("objetivos diferentes no mesmo dia", () => {
    const c = (objetivo: ContextoDia["objetivo"]) => ctx({ categoriaHoje: "qualidade", objetivo });
    expect(seloDe(PRATOS.macarraoAoSugoComFrango.nome, c("performance_corrida"))).toBe("ideal");
    expect(seloDe(PRATOS.macarraoAoSugoComFrango.nome, c("perda_peso"))).toBe("serve");
    expect(seloDe(PRATOS.saladaComFrango.nome, c("perda_peso"))).toBe("ideal");
    expect(seloDe(PRATOS.saladaComFrango.nome, c("performance_corrida"))).toBe("serve");
  });
});

describe("modificadores", () => {
  it("véspera sobe um nível de carboidrato", () => {
    expect(regraEfetiva(ctx({ objetivo: "perda_peso", categoriaAmanha: "qualidade" })).prioridades.carboidrato).toBe("moderado");
    expect(regraEfetiva(ctx({ categoriaHoje: "longao", categoriaAmanha: "longao" })).prioridades.carboidrato).toBe("alto");
  });

  it("pré/pós-treino não se aplicam em dia de descanso", () => {
    expect(regraEfetiva(ctx({ momento: "pre_treino" })).notas).toHaveLength(1);
    expect(regraEfetiva(ctx({ categoriaHoje: "leve", momento: "pre_treino" })).evitar.has("fibra_alta")).toBe(true);
  });

  it("evitar prevalece sobre favorecer", () => {
    const r = regraEfetiva(ctx({ categoriaHoje: "leve", momento: "pre_treino" }));
    expect(r.evitar.has("fibra_alta")).toBe(true);
    expect(r.favorecer.has("fibra_alta")).toBe(false);
  });

  it("álcool evita gordura e sal", () => {
    const r = regraEfetiva(ctx({ alcool: { doses: 3, quando: "hoje" } }));
    expect(r.evitar.has("gordura_alta")).toBe(true);
    expect(r.evitar.has("sodio_alto")).toBe(true);
    expect(seloDe(PRATOS.hamburguerCremoso.nome, ctx({ alcool: { doses: 3, quando: "hoje" } }))).toBe("evite");
  });
});

describe("álcool", () => {
  it("bebida alcoólica fica fora do ranking e sem selo", () => {
    const r = analisarCardapio(CARDAPIO, ctx());
    expect(r.foraDoRanking.map((i) => i.nome)).toEqual([PRATOS.cerveja.nome]);
    expect(r.ranking.some((a) => a.item.nome === PRATOS.cerveja.nome)).toBe(false);
  });

  it("bebeu ontem + treino pesado hoje sugere treino leve", () => {
    expect(avisosDoDia(ctx({ categoriaHoje: "longao", alcool: { doses: 2, quando: "ontem" } }))[0]).toMatch(/treino leve/);
    expect(avisosDoDia(ctx({ categoriaHoje: "leve", alcool: { doses: 2, quando: "ontem" } })).join()).not.toMatch(/treino leve/);
  });

  it("aviso de cuidado só a partir do limiar de doses", () => {
    expect(avisosDoDia(ctx({ alcool: { doses: 2, quando: "hoje" } }))).toHaveLength(1);
    expect(avisosDoDia(ctx({ alcool: { doses: 6, quando: "hoje" } })).join()).toMatch(/profissional de saúde/);
    expect(avisosDoDia(ctx())).toEqual([]);
  });
});

describe("restrições", () => {
  it("item incompatível vira 'evite' e vai para o fim", () => {
    const r = analisarCardapio(CARDAPIO, ctx({ categoriaHoje: "longao", restricoes: ["sem_gluten"] }));
    const macarrao = r.ranking.find((a) => a.item.nome === PRATOS.macarraoAoSugoComFrango.nome)!;
    expect(macarrao.selo).toBe("evite");
    expect(macarrao.razoes[0]).toMatch(/gluten/);
    expect(r.ranking.at(-1)!.pontos).toBe(-Infinity);
  });
});

describe("ajustes e custo-benefício", () => {
  it("sugere ajustes para o que pesa contra", () => {
    const a = avaliarItem(PRATOS.hamburguerCremoso, regraEfetiva(ctx({ objetivo: "perda_peso" })));
    expect(a.ajustes).toContain("Peça o molho à parte e use pouco.");
  });

  it("custo por grama de proteína é uma faixa", () => {
    expect(custoPorGramaProteina(PRATOS.grelhadoComArrozELegumes)).toEqual({ min: 32 / 40, max: 32 / 30 });
    expect(custoPorGramaProteina(PRATOS.refrigerante)).toBeNull();
    expect(custoPorGramaProteina(PRATOS.cerveja)).toBeNull();
  });

  it("empate de pontos desempata pelo menor custo", () => {
    const barato = { ...PRATOS.grelhadoComArrozELegumes, nome: "barato", preco: 20 };
    const r = analisarCardapio([PRATOS.grelhadoComArrozELegumes, barato], ctx());
    expect(r.ranking[0].item.nome).toBe("barato");
  });
});

describe("schema de extração", () => {
  it("aceita o cardápio de referência e rejeita tag desconhecida", () => {
    expect(extracaoCardapioSchema.safeParse({ itens: CARDAPIO }).success).toBe(true);
    expect(extracaoCardapioSchema.safeParse({ itens: [{ ...PRATOS.cerveja, tags: ["xyz"] }] }).success).toBe(false);
  });
});
