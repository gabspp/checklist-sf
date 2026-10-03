-- ============================================================
-- Sessões de preenchimento compartilhadas (checklists e formulários)
-- Permite que mais de uma pessoa preencha a mesma lista/formulário
-- da mesma loja ao mesmo tempo, com atualização em tempo real.
-- Executar no SQL Editor do Supabase
-- ============================================================

-- SESSÃO (uma aberta por lista/formulário + loja)
create table if not exists fill_sessions (
  id uuid primary key,
  kind text not null check (kind in ('form', 'checklist')),
  ref_id uuid not null,
  store_id uuid references stores(id) not null,
  status text default 'open' not null check (status in ('open', 'submitted', 'discarded')),
  comment text default '' not null,
  started_by_name text not null,
  started_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Garante uma única sessão aberta por lista/formulário + loja, mesmo com duas pessoas abrindo juntas
create unique index if not exists fill_sessions_one_open_idx
  on fill_sessions (kind, ref_id, store_id)
  where status = 'open';

-- PARTICIPANTES (uma linha por pessoa — evita race ao entrar)
create table if not exists fill_session_participants (
  session_id uuid references fill_sessions(id) on delete cascade not null,
  employee_id uuid references chk_employees(id) not null,
  employee_name text not null,
  joined_at timestamptz default now() not null,
  primary key (session_id, employee_id)
);

-- ITENS (uma linha por item — quantidade e flag são independentes entre pessoas)
-- flag = "comprar" em formulários e "feito" em checklists
create table if not exists fill_session_items (
  session_id uuid references fill_sessions(id) on delete cascade not null,
  item_id uuid not null,
  quantity numeric,
  flag boolean default false not null,
  updated_by uuid,
  updated_at timestamptz default now() not null,
  primary key (session_id, item_id)
);

-- ============================================================
-- RLS — mesmo modelo de segurança do chk_drafts (sem login, protegido por UUID)
-- ============================================================
alter table fill_sessions enable row level security;
alter table fill_session_participants enable row level security;
alter table fill_session_items enable row level security;

create policy "fill_sessions_public" on fill_sessions for all using (true) with check (true);
create policy "fill_session_participants_public" on fill_session_participants for all using (true) with check (true);
create policy "fill_session_items_public" on fill_session_items for all using (true) with check (true);

-- ============================================================
-- REALTIME — sem isso as telas só atualizam depois de recarregar
-- ============================================================
alter publication supabase_realtime add table fill_sessions, fill_session_participants, fill_session_items;
