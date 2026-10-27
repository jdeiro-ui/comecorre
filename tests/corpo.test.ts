import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { describe, expect, it } from "vitest";
import { extracaoBioSchema } from "@/lib/bio-schema";
import { lerBio } from "@/lib/formularios";
import { avaliarItem, metaProteinaG, regraEfetiva, type ContextoDia } from "@/lib/scoring";
import { PRATOS } from "./fixtures";

describe("meta de proteína por refeição", () => {
  // Medição de exemplo: 78,1 kg, 65,29 kg de massa magra.
  it("usa massa magra quando houver", () => {
    expect(metaProteinaG("moderado", { pesoKg: 78.1, massaMagraKg: 65.29 })).toBe(20);
    expect(metaProteinaG("alto", { pesoKg: 78.1, massaMagraKg: 65.29 })).toBe(29);
  });

  it("cai para o peso e depois para o valor fixo", () => {
    expect(metaProteinaG("alto", { pesoKg: 78.1 })).toBe(31);
    expect(metaProteinaG("alto", {})).toBe(30);
    expect(metaProteinaG("moderado")).toBe(20);
  });

  it("respeita os limites", () => {
    expect(metaProteinaG("moderado", { pesoKg: 45 })).toBe(15);
    expect(metaProteinaG("alto", { massaMagraKg: 130 })).toBe(45);
  });

  it("a mesma refeição pontua diferente conforme o corpo", () => {
    const ctx = (corpo?: ContextoDia["corpo"]): ContextoDia => ({
      objetivo: "hipertrofia",
      categoriaHoje: "forca",
      momento: "outro",
      corpo,
    });
    const leve = avaliarItem(PRATOS.grelhadoComArrozELegumes, regraEfetiva(ctx({ massaMagraKg: 50 })));
    const pesado = avaliarItem(PRATOS.grelhadoComArrozELegumes, regraEfetiva(ctx({ massaMagraKg: 95 })));
    expect(leve.pontos).toBeGreaterThan(pesado.pontos);
  });
});

describe("bioimpedância", () => {
  it("schema de extração é aceito por structured outputs", () => {
    expect(() => betaZodOutputFormat(extracaoBioSchema)).not.toThrow();
  });

  const fd = (e: Record<string, string>) => {
    const f = new FormData();
    Object.entries(e).forEach(([k, v]) => f.append(k, v));
    return f;
  };

  it("aceita a medição confirmada do print de exemplo", () => {
    const r = lerBio(fd({ medido_em: "2026-10-27", fonte: "print", peso_kg: "78.10", gordura_pct: "16.4", massa_magra_kg: "65.29", tmb_kcal: "1786", imc: "" }));
    expect(r.success).toBe(true);
    expect(r.data?.medidas).toMatchObject({ peso_kg: 78.1, massa_magra_kg: 65.29, imc: undefined });
  });

  it("rejeita medição vazia e valores fora da faixa", () => {
    expect(lerBio(fd({ medido_em: "2026-10-27", fonte: "manual" })).success).toBe(false);
    expect(lerBio(fd({ medido_em: "2026-10-27", fonte: "print", gordura_pct: "164" })).success).toBe(false);
  });
});
