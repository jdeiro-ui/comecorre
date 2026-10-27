import { z } from "zod";
import { CAMPOS_BIO, NOMES_CAMPOS_BIO, type CampoBio } from "./bio-schema";
import { INTENSIDADES, TIPOS_TREINO } from "@/rules/classificacao-treino";
import { CATEGORIAS, OBJETIVOS, RESTRICOES } from "@/rules/types";

const vazioParaUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);
const numeroOpcional = (min: number, max: number) =>
  z.preprocess(vazioParaUndefined, z.coerce.number().min(min).max(max).optional());
const marcado = z.preprocess((v) => v === "on" || v === "true", z.boolean());

export const perfilSchema = z.object({
  objetivo: z.enum(OBJETIVOS, { error: "Escolha um objetivo." }),
  peso_kg: numeroOpcional(20, 400),
  altura_cm: numeroOpcional(80, 260),
  idade: numeroOpcional(12, 120),
  restricoes: z.array(z.enum(RESTRICOES)),
  consentimento_saude: marcado.refine((v) => v, "É preciso aceitar para continuar."),
  consentimento_alcool: marcado,
});
export type PerfilForm = z.infer<typeof perfilSchema>;

export function lerPerfil(fd: FormData) {
  return perfilSchema.safeParse({
    objetivo: fd.get("objetivo"),
    peso_kg: fd.get("peso_kg"),
    altura_cm: fd.get("altura_cm"),
    idade: fd.get("idade"),
    restricoes: fd.getAll("restricoes"),
    consentimento_saude: fd.get("consentimento_saude"),
    consentimento_alcool: fd.get("consentimento_alcool"),
  });
}

export const treinoSchema = z
  .object({
    dia: z.enum(["hoje", "amanha"]),
    tipo: z.enum(TIPOS_TREINO, { error: "Escolha o tipo de treino." }),
    duracaoMin: z.coerce.number({ error: "Informe a duração." }).int().min(1).max(1440),
    distanciaKm: numeroOpcional(0, 500),
    intensidade: z.enum(INTENSIDADES, { error: "Escolha a intensidade." }),
    /** Treino de hoje ainda por fazer. Amanhã é sempre planejado. */
    planejado: marcado,
    /** Resposta do usuário quando a classificação é ambígua. */
    categoria: z.preprocess(vazioParaUndefined, z.enum(CATEGORIAS).optional()),
  })
  .transform((t) => ({ ...t, planejado: t.dia === "amanha" || t.planejado }));
export type TreinoForm = z.infer<typeof treinoSchema>;

export function lerTreino(fd: FormData) {
  return treinoSchema.safeParse(Object.fromEntries(fd));
}

const medidasBioSchema = z.object(
  Object.fromEntries(
    NOMES_CAMPOS_BIO.map((c) => [c, numeroOpcional(CAMPOS_BIO[c].min, CAMPOS_BIO[c].max)]),
  ) as Record<CampoBio, ReturnType<typeof numeroOpcional>>,
);

export const bioSchema = z
  .object({
    medido_em: z.iso.date({ error: "Informe a data da medição." }),
    fonte: z.enum(["print", "manual"]),
    medidas: medidasBioSchema,
  })
  .refine((b) => Object.values(b.medidas).some((v) => v !== undefined), {
    message: "Preencha pelo menos uma medida.",
    path: ["medidas"],
  });
export type BioForm = z.infer<typeof bioSchema>;

export function lerBio(fd: FormData) {
  return bioSchema.safeParse({
    medido_em: fd.get("medido_em"),
    fonte: fd.get("fonte"),
    medidas: Object.fromEntries(NOMES_CAMPOS_BIO.map((c) => [c, fd.get(c)])),
  });
}
