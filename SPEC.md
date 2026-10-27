# SPEC — App de nutrição contextual ao treino (MVP)

> Documento de partida para o Claude Code. Leia inteiro antes de criar qualquer arquivo. Em caso de dúvida de escopo, pergunte antes de construir.

## 1. Visão

App que responde uma pergunta: **"dado meu treino de hoje (e o de amanhã) e meu objetivo, o que devo comer neste cardápio?"**

Não é um contador de calorias. O usuário envia um cardápio (print, PDF ou link) e recebe um veredito por item (ideal / serve / evite), com justificativa curta, ajuste possível e custo-benefício.

## 2. Escopo do MVP

**Dentro:**
- Perfil: objetivo (hipertrofia, perda de peso, manutenção, performance de corrida) e dados básicos.
- Treino do dia e do dia seguinte: importação do Strava (realizado) + entrada manual rápida (planejado).
- Entrada de cardápio: múltiplos prints, PDF ou link (link = melhor esforço, com fallback).
- Veredito por item + ranking por adequação e por custo-benefício.
- Álcool como modificador do dia (planejado ou retroativo).
- Avisos de saúde e privacidade.

**Fora (não construir agora):**
- Geração de plano de treino.
- Registro de calorias/diário alimentar.
- Scraping de apps de delivery (iFood, Rappi, Keeta). Proibido por termos de uso.
- Integração direta com Garmin (exige aprovação empresarial; fica para fase posterior).
- Pagamentos, social, notificações push.

## 3. Princípios

1. **Orientação, não prescrição.** O app informa e sugere; nunca diagnostica nem prescreve dieta. Avisos claros na UI.
2. **Estimativas são estimativas.** Mostrar faixa de incerteza e permitir correção de porção pelo usuário.
3. **Regras auditáveis.** A lógica de recomendação fica em arquivo de regras legível (JSON/TS), não escondida em prompt. Um nutricionista deve conseguir revisá-lo.
4. **Privacidade por padrão.** Imagens e PDFs são processados e descartados; não persistir o arquivo. Dados de saúde e de consumo de álcool são sensíveis (LGPD).
5. **Tom sem julgamento**, especialmente no tema álcool. Nunca incentivar consumo.

## 4. Fluxos principais

**A. Onboarding (uma vez):** objetivo → peso/altura/idade (opcional) → restrições alimentares → conectar Strava (opcional).

**B. Tela inicial ("Hoje"):**
- Card do treino de hoje (vindo do Strava ou manual) e de amanhã (manual).
- Chip "Vou beber hoje" (nº aproximado de doses) e, pela manhã, "Bebeu ontem?".
- Botão principal: **"Analisar cardápio"**.

**C. Analisar cardápio:**
1. Tela única "cole, arraste ou envie print, PDF ou link", sem escolher o tipo.
2. Backend extrai itens (nome, descrição, preço, porção se houver).
3. Se faltar informação (cortado, sem descrição), pedir complemento antes do veredito.
4. Tela de veredito: lista ranqueada, selo por item, justificativa, ajuste sugerido ("sem batata palha"), preço final (considerando promoções), custo-benefício.
5. Usuário pode corrigir porção/ingrediente de um item e o veredito recalcula.

## 5. Categorias de demanda do dia

O treino (qualquer fonte) é classificado em uma categoria. É a ponte entre treino e comida:

| Categoria | Exemplos |
|---|---|
| descanso | sem treino |
| leve | regenerativo, caminhada, mobilidade |
| qualidade | tiros, ritmo, fartlek |
| longão | corrida longa (limiar por duração/distância configurável) |
| força | musculação pesada |
| duplo | dois treinos no dia |

Regras de classificação: a partir de tipo, duração, distância e intensidade (esforço percebido ou zonas de FC quando houver). Quando ambíguo, perguntar ao usuário.

## 6. Motor de regras (núcleo do produto)

Arquivo: `src/rules/nutrition-rules.ts` (ou `.json`). Estrutura: para cada combinação **categoria × objetivo**, definir:
- prioridades (ex.: carboidrato alto, proteína moderada),
- o que favorecer e o que evitar em termos de **tipo de prato** (grelhado vs frito, porção de carboidrato, gordura),
- momento (véspera, pré, pós),
- notas de justificativa em linguagem simples.

Modificadores aplicados por cima:
- **Véspera de longão/qualidade** → favorecer carboidrato.
- **Pós-treino** → proteína + reposição.
- **Álcool** (planejado ou ontem) → hidratação, proteína e carboidrato na refeição, evitar gordura/sal excessivos; treino leve sugerido no dia seguinte a uma noite com bebida.

> TODO humano: as regras iniciais são genéricas. Validar com nutricionista esportivo antes de lançar.

## 7. Análise do cardápio (IA)

- Usar a API da Anthropic com visão para ler imagens/PDF e extrair itens.
- **Saída estruturada em JSON** (validar com schema, ex.: zod): lista de itens com `nome`, `descricao`, `preco`, `preco_original?`, `porcao_estimada?`, `tags` (ex.: frito, grelhado, carboidrato alto), `proteina_g_estimada` (faixa), `confianca`.
- A **decisão de selo (ideal/serve/evite)** é feita pelo motor de regras (seção 6) sobre os dados extraídos, **não** pelo modelo livremente. O modelo extrai e estima; as regras decidem. O modelo pode redigir a justificativa a partir do resultado das regras.
- Custo-benefício: `preço final / proteína estimada` e uma pontuação de adequação ao objetivo; sempre exibir como estimativa com faixa.
- Link: buscar uma única URL fornecida pelo usuário, sem varrer o site; se falhar ou vier incompleta, orientar a enviar print/PDF.

## 8. Integrações

- **Strava (MVP):** OAuth 2.0, escopo mínimo de leitura de atividades. Importar atividades recentes e classificar. Tratar rate limits e renovação de token.
- **Entrada manual:** tipo, duração, intensidade (3 toques) para treino planejado e para musculação.
- **Fase 2:** Apple Health/Health Connect; Garmin Connect Developer Program (requer aprovação empresarial); calendário Google.

## 9. Modelo de dados (mínimo)

- `User`: id, objetivo, dados básicos opcionais, restrições, preferências.
- `Workout`: id, userId, data, fonte (strava|manual), tipo, duração, distância?, intensidade, categoria, planejado|realizado.
- `AlcoholEntry`: id, userId, data, doses, planejado|retroativo.
- `MenuAnalysis`: id, userId, criadoEm, itens (JSON), contexto (categoria do dia, objetivo, álcool). **Não armazenar o arquivo/imagem original.**

## 10. Stack sugerida

- Web app mobile-first (PWA), **Next.js + TypeScript**.
- Banco: Postgres (ex.: Supabase) ou SQLite no início.
- Autenticação simples (e-mail/OAuth).
- API da Anthropic para visão/extração.
- Validação de schemas (zod) e testes (Vitest) para o motor de regras.
- Variáveis sensíveis em `.env`, nunca no repositório.

Estrutura sugerida:
```
src/
  app/            # rotas e telas
  rules/          # nutrition-rules + testes
  lib/
    classify-workout.ts
    menu-extract.ts   # chamada à API de visão + schema
    scoring.ts        # selo + custo-benefício
    strava.ts
  db/
tests/
```

## 11. Privacidade e conformidade

- LGPD: consentimento explícito para dados de saúde e consumo de álcool; política de privacidade; exclusão de conta e dados.
- Não persistir imagens/PDFs; processar em memória.
- Avisos na UI: "orientação geral, não substitui nutricionista/médico". Tratar com cautela sinais de transtorno alimentar ou uso elevado de álcool (sugerir procurar profissional, sem moralismo).
- Respeitar termos de uso das plataformas; sem scraping de apps de delivery.

## 12. Plano de construção (marcos)

1. **Esqueleto:** projeto, autenticação, perfil/objetivo, telas vazias.
2. **Treino:** entrada manual + classificação em categorias + testes.
3. **Strava:** OAuth e importação de atividades.
4. **Motor de regras:** tabela categoria × objetivo + modificadores + testes unitários.
5. **Cardápio:** upload de print/PDF, extração estruturada, tela de veredito.
6. **Custo-benefício e correção de porção.**
7. **Álcool:** chip planejado/retroativo e ajuste de regras.
8. **Link (melhor esforço)** com fallback.
9. **Polimento:** avisos, privacidade, exclusão de dados, testes com cardápios reais.

## 13. Critérios de aceite do MVP

- Com 3 prints reais de cardápios de delivery, o app extrai os itens com precisão aceitável e rankeia coerentemente com o objetivo.
- O mesmo cardápio gera vereditos diferentes para "longão amanhã" vs "dia de descanso" e para objetivos diferentes.
- Nenhum arquivo enviado fica armazenado após a análise.
- Regras revisáveis em um único arquivo, com testes cobrindo cada combinação categoria × objetivo.

## 14. Primeira instrução sugerida ao Claude Code

> Leia o SPEC.md. Comece pelo marco 1 (esqueleto) e pelo marco 4 (motor de regras com testes), propondo primeiro a estrutura de pastas e a tabela categoria × objetivo para eu revisar antes de implementar as telas.
