import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { extracaoBioSchema, type ExtracaoBio } from "./bio-schema";

export const TIPOS_IMAGEM = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const TAMANHO_MAX_IMAGEM = 4 * 1024 * 1024;

const INSTRUCOES = `Você transcreve resultados de balanças de bioimpedância a partir de prints de aplicativos.
Copie apenas valores visíveis na imagem, no campo correspondente e na unidade indicada.
Cada cartão costuma mostrar o valor atual e, abaixo, a variação em relação à medição anterior (ex.: "-1.35", "+0.3"): use somente o valor atual, nunca a variação.
"Peso corporal sem gordura" corresponde a massa_magra_kg. Não calcule nem estime: campo ausente ou ilegível é null.
Se a imagem não for um resultado de bioimpedância, marque e_bioimpedancia como false e deixe as medidas null.`;

/** Lê o print em memória e devolve as medidas. A imagem não é armazenada. */
export async function extrairBioimpedancia(
  imagem: Buffer,
  tipo: (typeof TIPOS_IMAGEM)[number],
): Promise<ExtracaoBio | null> {
  const client = new Anthropic();
  const resposta = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(extracaoBioSchema) },
    system: INSTRUCOES,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: tipo, data: imagem.toString("base64") } },
          { type: "text", text: "Transcreva as medidas deste print." },
        ],
      },
    ],
  });
  if (resposta.stop_reason === "refusal") return null;
  return resposta.parsed_output;
}
