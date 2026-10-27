# Proposta — marcos 1 e 4 (para revisão)

Status: marcos 1, 2 e 4 implementados (Supabase com login por link mágico, perfil, entrada manual de treino com classificação, motor de regras). Tela de cardápio ainda vazia.

## Estrutura de pastas

```
src/
  app/                    # rotas (App Router)
    page.tsx              # "Hoje" (vazia)
    onboarding/page.tsx   # perfil (vazia)
    analisar/page.tsx     # analisar cardápio (vazia)
  rules/
    types.ts              # vocabulário: objetivos, categorias, tags, restrições
    nutrition-rules.ts    # ÚNICO arquivo de regras (tabela, modificadores, pesos, ajustes, álcool)
  lib/
    menu-schema.ts        # schema zod do item extraído pela IA
    scoring.ts            # aplica as regras: selo, ajustes, custo-benefício, ranking
    # (próximos) classify-workout.ts, menu-extract.ts, strava.ts
  db/supabase.ts          # cliente Supabase (servidor) e usuário atual
  proxy.ts                # renova sessão e exige login
supabase/migrations/      # schema SQL + RLS
tests/
  fixtures.ts             # cardápio de referência
  scoring.test.ts         # 24 combinações categoria × objetivo + modificadores
```

## Tabela categoria × objetivo

Fonte da verdade: `src/rules/nutrition-rules.ts` (`REGRAS`). Cada combinação também tem uma nota em linguagem simples, exibível ao usuário.

| Categoria | Objetivo | Carbo | Proteína | Gordura | Favorecer | Evitar |
|---|---|---|---|---|---|---|
| descanso | hipertrofia | moderado | alto | moderado | grelhado, assado, vegetais | frito, empanado, acucar_alto, bebida_acucarada |
| descanso | perda_peso | baixo | alto | baixo | grelhado, vegetais, fibra_alta | frito, empanado, molho_cremoso, acucar_alto, bebida_acucarada, ultraprocessado |
| descanso | manutencao | moderado | moderado | moderado | vegetais, grelhado, assado | frito, empanado, acucar_alto, ultraprocessado |
| descanso | performance_corrida | moderado | moderado | moderado | vegetais, fibra_alta, grelhado | frito, empanado, ultraprocessado, bebida_acucarada |
| leve | hipertrofia | moderado | alto | moderado | grelhado, assado, vegetais | frito, empanado, acucar_alto |
| leve | perda_peso | baixo | alto | baixo | grelhado, vegetais, fibra_alta | frito, empanado, molho_cremoso, acucar_alto, bebida_acucarada |
| leve | manutencao | moderado | moderado | moderado | vegetais, grelhado, assado | frito, empanado, acucar_alto |
| leve | performance_corrida | moderado | moderado | moderado | vegetais, grelhado, cozido | frito, empanado, ultraprocessado |
| qualidade | hipertrofia | alto | alto | moderado | grelhado, cozido | frito, empanado, molho_cremoso |
| qualidade | perda_peso | moderado | alto | baixo | grelhado, cozido, vegetais | frito, empanado, molho_cremoso, acucar_alto |
| qualidade | manutencao | moderado | moderado | moderado | grelhado, cozido, vegetais | frito, empanado, molho_cremoso |
| qualidade | performance_corrida | alto | moderado | baixo | cozido, grelhado | frito, empanado, molho_cremoso |
| longao | hipertrofia | alto | alto | moderado | cozido, grelhado | frito, empanado, molho_cremoso |
| longao | perda_peso | moderado | alto | baixo | cozido, grelhado, vegetais | frito, empanado, molho_cremoso, acucar_alto |
| longao | manutencao | alto | moderado | moderado | cozido, grelhado | frito, empanado, molho_cremoso |
| longao | performance_corrida | alto | moderado | baixo | cozido, grelhado | frito, empanado, molho_cremoso |
| forca | hipertrofia | moderado | alto | moderado | grelhado, assado, ovo | frito, empanado, acucar_alto |
| forca | perda_peso | moderado | alto | baixo | grelhado, vegetais | frito, empanado, molho_cremoso, acucar_alto |
| forca | manutencao | moderado | alto | moderado | grelhado, assado | frito, empanado, acucar_alto |
| forca | performance_corrida | moderado | alto | moderado | grelhado, vegetais | frito, empanado, ultraprocessado |
| duplo | hipertrofia | alto | alto | moderado | cozido, grelhado | frito, empanado, molho_cremoso |
| duplo | perda_peso | moderado | alto | baixo | cozido, grelhado, vegetais | frito, empanado, molho_cremoso, acucar_alto |
| duplo | manutencao | alto | moderado | moderado | cozido, grelhado | frito, empanado, molho_cremoso |
| duplo | performance_corrida | alto | moderado | baixo | cozido, grelhado | frito, empanado, molho_cremoso |

## Modificadores (aplicados por cima)

| Quando | Efeito |
|---|---|
| Amanhã é longão ou qualidade (véspera) | carboidrato sobe 1 nível; favorece cozido; evita frito, gordura alta, molho cremoso |
| Pré-treino (hoje ≠ descanso) | favorece carbo moderado, cozido; evita frito, gordura, fibra alta, molho cremoso |
| Pós-treino (hoje ≠ descanso) | proteína vira prioridade alta; favorece carboidrato |
| Álcool (planejado hoje ou ontem) | proteína alta; favorece carbo moderado e vegetais; evita gordura, frito, molho cremoso, sódio |

Em conflito entre favorecer e evitar, **evitar prevalece**.

## Como o selo é calculado

O modelo de IA só extrai e estima (tags + faixa de proteína). Pontuação (pesos em `PESOS`):

- Carboidrato do item = pedido: **+2** · um nível acima: **−1** · um nível abaixo: 0 · oposto: **−2**
- Proteína (ponto médio da faixa) ≥ meta (20 g moderado / 30 g alto): **+2** · < 60% da meta: **−2**
- `gordura_alta` (se não já estiver em evitar): **−2** com prioridade baixa, **−1** com moderada
- Cada tag favorecida **+1**, cada tag evitada **−2**
- **≥ 3 → ideal · ≥ 0 → serve · < 0 → evite**
- Restrição alimentar violada → **evite** direto, vai para o fim do ranking.
- Empate → menor custo por grama de proteína (R$/g, exibido como faixa).

## Decisões que tomei e precisam do seu ok

1. **Bebidas alcoólicas do cardápio ficam fora do ranking**, sem selo — para não parecer incentivo nem julgamento.
2. **Fritura/empanado = evite em todas as combinações.** Num dia de longão para hipertrofia, uma parmegiana poderia ser "serve"; optei pelo conservador.
3. Bebeu ontem + treino pesado hoje (qualidade, longão, duplo, força) → sugestão de trocar por treino leve.
4. Aviso de cuidado com álcool a partir de **5 doses** — texto neutro sugerindo profissional de saúde.
5. Pré/pós-treino não se aplicam em dia de descanso.

## Classificação de treino (marco 2)

Limiares em `src/rules/classificacao-treino.ts`:

| Tipo | Leve | Moderada | Forte |
|---|---|---|---|
| Corrida | leve | **pergunta** (leve/qualidade) | qualidade |
| Musculação | leve | **pergunta** (força/leve) | força |
| Outro cardio | leve | **pergunta** (leve/qualidade) | qualidade |
| Caminhada, mobilidade | sempre leve | | |

- Corrida ≥ **90 min ou ≥ 18 km** → longão (qualquer intensidade).
- Outro cardio (bike, natação…) ≥ 120 min → longão. *A confirmar.*
- Dia: sem treino → descanso; 2+ treinos não leves → duplo; senão vale o treino mais exigente (leve + qualidade = qualidade).

## Bioimpedância e meta de proteína

Tela **Corpo** (`/corpo`): envio do print da balança → a IA transcreve os valores (sem armazenar a imagem) → o usuário confere/corrige → salva em `body_compositions`. Também aceita preenchimento manual. Histórico com exclusão por medição.

A meta de proteína por refeição deixa de ser fixa (`META_PROTEINA` em `nutrition-rules.ts`):

| Referência disponível | Prioridade moderada | Prioridade alta |
|---|---|---|
| Massa magra (bioimpedância) | 0,30 g/kg | 0,45 g/kg |
| Só peso (medição ou perfil) | 0,25 g/kg | 0,40 g/kg |
| Nenhuma | 20 g | 30 g |

Sempre limitada a 15–45 g por refeição. Ex.: massa magra 65,3 kg → ~20 g / ~29 g.
Os demais dados (gordura visceral, TMB, água…) só são registrados e exibidos — não entram nos vereditos.

## Decidido

- Banco e auth: **Supabase** (login por link mágico no e-mail; RLS em todas as tabelas).
- Longão: a partir de 90 min ou 18 km.
- Bioimpedância personaliza a meta de proteína (não é contador de calorias: TMB não é usada).

## Perguntas em aberto

- Limiar de longão para outros cardios (assumi 120 min).
- Revisão por nutricionista esportivo da tabela, dos fatores de proteína (g/kg) e dos pesos.
