-- Modelo de dados mínimo (SPEC §9). Todas as tabelas com RLS: cada usuário só vê os próprios dados.
-- Exclusão de conta (LGPD): apagar o usuário em auth.users apaga tudo em cascata.

create type objetivo as enum ('hipertrofia', 'perda_peso', 'manutencao', 'performance_corrida');
create type categoria as enum ('descanso', 'leve', 'qualidade', 'longao', 'forca', 'duplo');
create type tipo_treino as enum ('corrida', 'musculacao', 'caminhada', 'mobilidade', 'outro_cardio');
create type intensidade as enum ('leve', 'moderada', 'forte');
create type fonte_treino as enum ('strava', 'manual');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  objetivo objetivo not null,
  peso_kg numeric(5, 1) check (peso_kg between 20 and 400),
  altura_cm integer check (altura_cm between 80 and 260),
  idade integer check (idade between 12 and 120),
  restricoes text[] not null default '{}',
  -- Consentimento explícito (LGPD): dados de saúde e de consumo de álcool.
  consentimento_saude_em timestamptz not null,
  consentimento_alcool_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  fonte fonte_treino not null,
  strava_id bigint,
  tipo tipo_treino not null,
  duracao_min integer not null check (duracao_min > 0),
  distancia_km numeric(6, 2) check (distancia_km >= 0),
  intensidade intensidade not null,
  categoria categoria not null,
  planejado boolean not null,
  criado_em timestamptz not null default now(),
  unique (user_id, strava_id)
);
create index workouts_user_data on workouts (user_id, data);

create table alcohol_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  doses integer not null check (doses > 0),
  planejado boolean not null,
  criado_em timestamptz not null default now()
);
create index alcohol_entries_user_data on alcohol_entries (user_id, data);

-- Nunca armazena o arquivo/imagem original do cardápio, só os itens extraídos.
create table menu_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  itens jsonb not null,
  contexto jsonb not null
);
create index menu_analyses_user on menu_analyses (user_id, criado_em desc);

alter table profiles enable row level security;
alter table workouts enable row level security;
alter table alcohol_entries enable row level security;
alter table menu_analyses enable row level security;

create policy "dono" on profiles for all
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "dono" on workouts for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono" on alcohol_entries for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono" on menu_analyses for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
