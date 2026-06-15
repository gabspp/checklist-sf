-- Rascunhos de checklist em andamento
-- Permite retomar uma lista iniciada por outro colaborador no mesmo dia

create table if not exists chk_drafts (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) not null,
  list_id uuid references chk_lists(id) on delete cascade not null,
  employee_name text not null,
  checked_ids text[] default '{}' not null,
  started_at timestamptz default now(),
  constraint chk_drafts_unique_list_store unique (list_id, store_id)
);

alter table chk_drafts enable row level security;

-- Acesso público total (dados não sensíveis, protegidos por UUIDs não adivinháveis)
create policy "chk_drafts_public" on chk_drafts
  for all using (true) with check (true);
