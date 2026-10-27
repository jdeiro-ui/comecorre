import type { ItemCardapio } from "@/lib/menu-schema";

/** Cardápio de referência usado nos testes. */
export const PRATOS = {
  grelhadoComArrozELegumes: {
    nome: "Frango grelhado com arroz e legumes",
    preco: 32,
    tags: ["grelhado", "frango", "carboidrato_moderado", "proteina_alta", "vegetais"],
    proteina_g_estimada: { min: 30, max: 40 },
    confianca: 0.9,
  },
  macarraoAoSugoComFrango: {
    nome: "Espaguete ao sugo com frango",
    preco: 38,
    tags: ["cozido", "frango", "gluten", "carboidrato_alto", "proteina_alta"],
    proteina_g_estimada: { min: 28, max: 38 },
    confianca: 0.85,
  },
  saladaComFrango: {
    nome: "Salada com frango grelhado",
    preco: 34,
    tags: ["grelhado", "frango", "vegetais", "fibra_alta", "carboidrato_baixo", "proteina_alta"],
    proteina_g_estimada: { min: 28, max: 35 },
    confianca: 0.9,
  },
  parmegianaComFritas: {
    nome: "Parmegiana com fritas",
    preco: 45,
    tags: ["empanado", "frito", "carne_vermelha", "lactose", "gluten", "carboidrato_alto", "gordura_alta", "sodio_alto"],
    proteina_g_estimada: { min: 30, max: 45 },
    confianca: 0.8,
  },
  hamburguerCremoso: {
    nome: "Hambúrguer com cheddar cremoso e batata palha",
    preco: 40,
    tags: ["carne_vermelha", "lactose", "gluten", "molho_cremoso", "gordura_alta", "carboidrato_moderado", "ultraprocessado"],
    proteina_g_estimada: { min: 25, max: 35 },
    confianca: 0.8,
  },
  refrigerante: {
    nome: "Refrigerante lata",
    preco: 7,
    tags: ["bebida_acucarada", "acucar_alto", "carboidrato_alto"],
    proteina_g_estimada: { min: 0, max: 0 },
    confianca: 0.95,
  },
  cerveja: {
    nome: "Cerveja long neck",
    preco: 14,
    tags: ["bebida_alcoolica"],
    confianca: 0.95,
  },
} satisfies Record<string, ItemCardapio>;

export const CARDAPIO: ItemCardapio[] = Object.values(PRATOS);
