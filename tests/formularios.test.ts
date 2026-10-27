import { describe, expect, it } from "vitest";
import { lerPerfil, lerTreino } from "@/lib/formularios";
import { dataLocal, somarDias } from "@/lib/datas";

const fd = (entradas: [string, string][]) => {
  const f = new FormData();
  entradas.forEach(([k, v]) => f.append(k, v));
  return f;
};

describe("perfil", () => {
  it("aceita só objetivo + consentimento; dados básicos são opcionais", () => {
    const r = lerPerfil(fd([["objetivo", "perda_peso"], ["peso_kg", ""], ["consentimento_saude", "on"]]));
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ objetivo: "perda_peso", peso_kg: undefined, restricoes: [], consentimento_alcool: false });
  });

  it("exige consentimento de dados de saúde", () => {
    const r = lerPerfil(fd([["objetivo", "manutencao"]]));
    expect(r.success).toBe(false);
  });

  it("lê várias restrições e rejeita valores fora da faixa", () => {
    const ok = lerPerfil(fd([["objetivo", "hipertrofia"], ["restricoes", "vegano"], ["restricoes", "sem_gluten"], ["consentimento_saude", "on"]]));
    expect(ok.data?.restricoes).toEqual(["vegano", "sem_gluten"]);
    expect(lerPerfil(fd([["objetivo", "hipertrofia"], ["idade", "5"], ["consentimento_saude", "on"]])).success).toBe(false);
  });
});

describe("treino manual", () => {
  const base: [string, string][] = [["tipo", "corrida"], ["duracaoMin", "60"], ["intensidade", "forte"]];

  it("amanhã é sempre planejado", () => {
    expect(lerTreino(fd([["dia", "amanha"], ...base])).data?.planejado).toBe(true);
  });

  it("hoje é realizado salvo se marcado como planejado", () => {
    expect(lerTreino(fd([["dia", "hoje"], ...base])).data?.planejado).toBe(false);
    expect(lerTreino(fd([["dia", "hoje"], ["planejado", "on"], ...base])).data?.planejado).toBe(true);
  });

  it("distância vazia vira undefined; duração é obrigatória", () => {
    expect(lerTreino(fd([["dia", "hoje"], ["distanciaKm", ""], ...base])).data?.distanciaKm).toBeUndefined();
    expect(lerTreino(fd([["dia", "hoje"], ["tipo", "corrida"], ["intensidade", "leve"]])).success).toBe(false);
  });
});

describe("datas", () => {
  it("usa o fuso de São Paulo", () => {
    // 01:30 UTC de 28/10 ainda é 27/10 em São Paulo (UTC-3)
    expect(dataLocal(new Date("2026-10-28T01:30:00Z"))).toBe("2026-10-27");
  });

  it("soma dias atravessando mês", () => {
    expect(somarDias("2026-10-31", 1)).toBe("2026-11-01");
  });
});
