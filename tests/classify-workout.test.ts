import { describe, expect, it } from "vitest";
import { categoriaDoDia, classificarTreino } from "@/lib/classify-workout";

describe("classificarTreino", () => {
  it("corrida é longão a partir de 90 min ou 18 km", () => {
    expect(classificarTreino({ tipo: "corrida", duracaoMin: 90, intensidade: "leve" })).toEqual({ ambigua: false, categoria: "longao" });
    expect(classificarTreino({ tipo: "corrida", duracaoMin: 85, distanciaKm: 18, intensidade: "moderada" })).toEqual({ ambigua: false, categoria: "longao" });
    expect(classificarTreino({ tipo: "corrida", duracaoMin: 89, distanciaKm: 17.9, intensidade: "leve" })).toEqual({ ambigua: false, categoria: "leve" });
  });

  it("corrida curta: forte é qualidade, leve é leve, moderada pergunta", () => {
    expect(classificarTreino({ tipo: "corrida", duracaoMin: 50, intensidade: "forte" })).toEqual({ ambigua: false, categoria: "qualidade" });
    expect(classificarTreino({ tipo: "corrida", duracaoMin: 40, intensidade: "leve" })).toEqual({ ambigua: false, categoria: "leve" });
    expect(classificarTreino({ tipo: "corrida", duracaoMin: 60, intensidade: "moderada" })).toEqual({ ambigua: true, opcoes: ["leve", "qualidade"] });
  });

  it("musculação forte é força; moderada pergunta", () => {
    expect(classificarTreino({ tipo: "musculacao", duracaoMin: 60, intensidade: "forte" })).toEqual({ ambigua: false, categoria: "forca" });
    expect(classificarTreino({ tipo: "musculacao", duracaoMin: 60, intensidade: "moderada" })).toEqual({ ambigua: true, opcoes: ["forca", "leve"] });
    expect(classificarTreino({ tipo: "musculacao", duracaoMin: 120, intensidade: "leve" })).toEqual({ ambigua: false, categoria: "leve" });
  });

  it("caminhada e mobilidade são sempre leves, mesmo longas", () => {
    expect(classificarTreino({ tipo: "caminhada", duracaoMin: 150, distanciaKm: 20, intensidade: "forte" })).toEqual({ ambigua: false, categoria: "leve" });
    expect(classificarTreino({ tipo: "mobilidade", duracaoMin: 30, intensidade: "moderada" })).toEqual({ ambigua: false, categoria: "leve" });
  });

  it("outro cardio é longão só a partir de 120 min", () => {
    expect(classificarTreino({ tipo: "outro_cardio", duracaoMin: 120, intensidade: "moderada" })).toEqual({ ambigua: false, categoria: "longao" });
    expect(classificarTreino({ tipo: "outro_cardio", duracaoMin: 100, distanciaKm: 40, intensidade: "forte" })).toEqual({ ambigua: false, categoria: "qualidade" });
  });
});

describe("categoriaDoDia", () => {
  it("sem treino é descanso", () => {
    expect(categoriaDoDia([])).toBe("descanso");
  });

  it("um treino define o dia", () => {
    expect(categoriaDoDia(["longao"])).toBe("longao");
  });

  it("treino leve junto de um forte não vira duplo", () => {
    expect(categoriaDoDia(["leve", "qualidade"])).toBe("qualidade");
    expect(categoriaDoDia(["leve", "leve"])).toBe("leve");
  });

  it("dois treinos não leves viram duplo", () => {
    expect(categoriaDoDia(["qualidade", "forca"])).toBe("duplo");
    expect(categoriaDoDia(["forca", "leve", "longao"])).toBe("duplo");
  });
});
