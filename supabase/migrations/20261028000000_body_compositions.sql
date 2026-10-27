-- Medidas de bioimpedância (do print da balança, confirmadas pelo usuário, ou manuais).
-- O print em si nunca é armazenado.
create type fonte_medida as enum ('print', 'manual');

create table body_compositions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medido_em date not null,
  fonte fonte_medida not null,
  peso_kg numeric(5, 2),
  imc numeric(4, 1),
  gordura_pct numeric(4, 1),
  gordura_subcutanea_pct numeric(4, 1),
  gordura_visceral numeric(4, 1),
  massa_muscular_kg numeric(5, 2),
  musculo_esqueletico_pct numeric(4, 1),
  massa_ossea_kg numeric(4, 2),
  massa_magra_kg numeric(5, 2),
  idade_metabolica integer,
  tmb_kcal integer,
  agua_pct numeric(4, 1),
  proteina_pct numeric(4, 1),
  criado_em timestamptz not null default now()
);
create index body_compositions_user_data on body_compositions (user_id, medido_em desc);

alter table body_compositions enable row level security;
create policy "dono" on body_compositions for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
