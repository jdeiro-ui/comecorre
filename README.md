# ComeCorre

App de nutrição contextual ao treino. Escopo e princípios em [SPEC.md](SPEC.md); proposta atual em [docs/PROPOSTA.md](docs/PROPOSTA.md).

## Rodando

1. Crie um projeto no [Supabase](https://supabase.com) e aplique `supabase/migrations/*.sql`
   (SQL Editor, ou `npx supabase db push` com a CLI vinculada ao projeto).
2. Em **Authentication → URL Configuration**, adicione `http://localhost:3000/auth/callback` às Redirect URLs.
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API Keys).

```bash
npm install
npm test          # motor de regras e classificação (Vitest)
npm run typecheck
npm run dev
```

Regras revisáveis: `src/rules/nutrition-rules.ts` (comida) e `src/rules/classificacao-treino.ts` (treino).
