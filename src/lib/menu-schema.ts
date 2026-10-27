import { z } from "zod";
import { TAGS } from "@/rules/types";

const faixa = z
  .object({ min: z.number().nonnegative(), max: z.number().nonnegative() })
  .refine((f) => f.min <= f.max, { message: "min deve ser <= max" });

/** Item extraído do cardápio pela IA. A IA extrai e estima; não decide o selo. */
export const itemCardapioSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  /** Preço final, já considerando promoções. */
  preco: z.number().nonnegative().optional(),
  preco_original: z.number().nonnegative().optional(),
  porcao_estimada: z.string().optional(),
  tags: z.array(z.enum(TAGS)),
  proteina_g_estimada: faixa.optional(),
  /** Confiança da extração, de 0 a 1. */
  confianca: z.number().min(0).max(1),
});

export type ItemCardapio = z.infer<typeof itemCardapioSchema>;

export const extracaoCardapioSchema = z.object({
  itens: z.array(itemCardapioSchema),
  /** Itens cortados ou sem descrição suficiente — pedir complemento ao usuário. */
  pendencias: z.array(z.string()).default([]),
});

export type ExtracaoCardapio = z.infer<typeof extracaoCardapioSchema>;
