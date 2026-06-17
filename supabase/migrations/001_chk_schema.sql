-- ============================================================
-- Checklists — Módulo Santo Favo OS
-- Executar no SQL Editor do Supabase
-- ============================================================

-- LOJAS (criar se ainda não existir — compartilhada com outros módulos)
create table if not exists stores (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique
);

-- Seed das lojas (ajuste os nomes se necessário)
insert into stores (name) values ('248'), ('26')
on conflict (name) do nothing;

-- Leitura pública das lojas (necessário para o fluxo de preenchimento anônimo)
alter table stores enable row level security;
drop policy if exists "stores_read_public" on stores;
create policy "stores_read_public" on stores for select using (true);
create policy "stores_admin" on stores for all using (auth.role() = 'authenticated');

-- COLABORADORES
create table if not exists chk_employees (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) not null,
  name text not null,
  active boolean default true not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- LISTAS (por loja)
create table if not exists chk_lists (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) not null,
  name text not null,
  active boolean default true not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- TAREFAS (itens de uma lista)
-- day_of_week null = toda semana; ex: 'segunda-feira', 'sábado' = dia específico
create table if not exists chk_tasks (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references chk_lists(id) on delete cascade not null,
  text text not null,
  active boolean default true not null,
  sort_order int default 0,
  day_of_week text default null
);

-- SUBMISSÕES (cabeçalho de um preenchimento)
create table if not exists chk_submissions (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) not null,
  list_id uuid references chk_lists(id) not null,
  list_name text not null,
  employee_id uuid references chk_employees(id),
  employee_name text not null,
  comment text,
  total_count int not null,
  done_count int not null,
  submitted_at timestamptz default now()
);

-- ITENS DA SUBMISSÃO (snapshot do que foi marcado)
create table if not exists chk_submission_items (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references chk_submissions(id) on delete cascade not null,
  text text not null,
  done boolean not null
);

-- CONFIGURAÇÕES
create table if not exists chk_settings (
  key text primary key,
  value text not null
);

create index if not exists chk_submissions_submitted_at_idx on chk_submissions (submitted_at);
create index if not exists chk_submissions_store_list_idx on chk_submissions (store_id, list_id);

-- ============================================================
-- RLS
-- ============================================================
alter table chk_employees enable row level security;
alter table chk_lists enable row level security;
alter table chk_tasks enable row level security;
alter table chk_submissions enable row level security;
alter table chk_submission_items enable row level security;
alter table chk_settings enable row level security;

-- Leitura pública (anon) — para preenchimento sem login
create policy "chk_employees_read_public" on chk_employees for select using (true);
create policy "chk_lists_read_public" on chk_lists for select using (true);
create policy "chk_tasks_read_public" on chk_tasks for select using (true);
create policy "chk_settings_read_public" on chk_settings for select using (true);

-- Insert de submissão público (anon pode gravar)
create policy "chk_submissions_insert_public" on chk_submissions for insert with check (true);
create policy "chk_submission_items_insert_public" on chk_submission_items for insert with check (true);

-- CRUD completo só para usuários autenticados (admin)
create policy "chk_employees_admin" on chk_employees for all using (auth.role() = 'authenticated');
create policy "chk_lists_admin" on chk_lists for all using (auth.role() = 'authenticated');
create policy "chk_tasks_admin" on chk_tasks for all using (auth.role() = 'authenticated');
create policy "chk_submissions_admin_read" on chk_submissions for select using (auth.role() = 'authenticated');
create policy "chk_submissions_admin_delete" on chk_submissions for delete using (auth.role() = 'authenticated');
create policy "chk_submission_items_admin" on chk_submission_items for select using (auth.role() = 'authenticated');
create policy "chk_settings_admin" on chk_settings for all using (auth.role() = 'authenticated');

-- ============================================================
-- SEED — configurações iniciais
-- ============================================================
insert into chk_settings (key, value)
values 
  ('whatsapp_number', '5500000000000'),
  ('telegram_token', ''),
  ('telegram_chat_id', ''),
  ('notification_email', '')
on conflict (key) do nothing;

-- ============================================================
-- SEED — listas e tarefas
-- Ajuste os nomes das lojas conforme a tabela `stores`
-- ============================================================
do $$
declare
  store_248 uuid;
  store_26 uuid;
  list_abertura_248 uuid;
  list_fechamento_248 uuid;
  list_abertura_26 uuid;
  list_fechamento_26 uuid;
begin
  -- Buscar IDs das lojas (ajuste o filtro conforme o name real na tabela stores)
  select id into store_248 from stores where name ilike '%248%' limit 1;
  select id into store_26 from stores where name ilike '%26%' and name not ilike '%248%' limit 1;

  if store_248 is null or store_26 is null then
    raise notice 'Lojas não encontradas — verifique os nomes na tabela stores e ajuste o seed.';
    return;
  end if;

  -- Listas da loja 248
  insert into chk_lists (store_id, name, sort_order) values (store_248, 'Abertura', 0) returning id into list_abertura_248;
  insert into chk_lists (store_id, name, sort_order) values (store_248, 'Fechamento', 1) returning id into list_fechamento_248;

  -- Listas da loja 26
  insert into chk_lists (store_id, name, sort_order) values (store_26, 'Abertura', 0) returning id into list_abertura_26;
  insert into chk_lists (store_id, name, sort_order) values (store_26, 'Fechamento', 1) returning id into list_fechamento_26;

  -- Tarefas de Abertura (ambas as lojas recebem a mesma lista como ponto de partida)
  with abertura_tasks(txt, ord) as (values
    ('organizar lixeiras', 0),
    ('ligar máquina de café', 1),
    ('encher galão d''água', 2),
    ('abrir caixa', 3),
    ('conferir bateria das máquinas de cartão', 4),
    ('pegar perfex', 5),
    ('conferir crocantes', 6),
    ('conferir estoque itens takeat', 7),
    ('montar vitrine de produtos', 8),
    ('estoque coado P & G', 9),
    ('pegar porta filtros', 10),
    ('colocar café na cuba', 11),
    ('montar caixas de barrinha', 12),
    ('montar colmeia de pães de mel', 13),
    ('tirar itens da geladeira', 14),
    ('fazer café coado', 15),
    ('montar caixinhas de presente', 16),
    ('montar caixinha de 3 do balcão', 17),
    ('repor água com e sem gás', 18),
    ('encher reservas de água', 19),
    ('verificar estoque ifood', 20),
    ('repor açúcar', 21),
    ('fazer etiquetas de validade', 22),
    ('fazer papel do mês', 23)
  )
  insert into chk_tasks (list_id, text, sort_order)
  select list_abertura_248, txt, ord from abertura_tasks;

  with abertura_tasks(txt, ord) as (values
    ('organizar lixeiras', 0),
    ('ligar máquina de café', 1),
    ('encher galão d''água', 2),
    ('abrir caixa', 3),
    ('conferir bateria das máquinas de cartão', 4),
    ('pegar perfex', 5),
    ('conferir crocantes', 6),
    ('conferir estoque itens takeat', 7),
    ('montar vitrine de produtos', 8),
    ('estoque coado P & G', 9),
    ('pegar porta filtros', 10),
    ('colocar café na cuba', 11),
    ('montar caixas de barrinha', 12),
    ('montar colmeia de pães de mel', 13),
    ('tirar itens da geladeira', 14),
    ('fazer café coado', 15),
    ('montar caixinhas de presente', 16),
    ('montar caixinha de 3 do balcão', 17),
    ('repor água com e sem gás', 18),
    ('encher reservas de água', 19),
    ('verificar estoque ifood', 20),
    ('repor açúcar', 21),
    ('fazer etiquetas de validade', 22),
    ('fazer papel do mês', 23)
  )
  insert into chk_tasks (list_id, text, sort_order)
  select list_abertura_26, txt, ord from abertura_tasks;

  -- Tarefas de Fechamento
  with fechamento_tasks(txt, ord) as (values
    ('guardar encomendas na geladeira', 0),
    ('lavar porta filtros', 1),
    ('limpar gaveta de borra de café', 2),
    ('limpar bancada barista', 3),
    ('conferir itens no carrinho', 4),
    ('esvaziar cuba de café e moer descarte', 5),
    ('virar placa', 6),
    ('limpar garrafa térmica', 7),
    ('deixar maquininhas carregando', 8),
    ('limpar máquina de café', 9),
    ('tirar lixo do café', 10),
    ('atualizar encomendas de bolo no vidro', 11),
    ('enviar foto estoque de pães de mel', 12),
    ('cadastrar novos pedidos no NOTION', 13),
    ('fechar caixa', 14),
    ('contar pães de mel', 15),
    ('finalizar comandas no takeat', 16),
    ('guardar bolinho de mel', 17),
    ('limpar grade máquina de café', 18),
    ('desligar moinho de café', 19),
    ('limpar gaveta bate borra', 20),
    ('desligar máquina de café', 21),
    ('desligar ar condicionado', 22),
    ('desligar cortina de vento', 23),
    ('tirar galão descarte', 24),
    ('guardar produtos na geladeira', 25)
  )
  insert into chk_tasks (list_id, text, sort_order)
  select list_fechamento_248, txt, ord from fechamento_tasks;

  with fechamento_tasks(txt, ord) as (values
    ('guardar encomendas na geladeira', 0),
    ('lavar porta filtros', 1),
    ('limpar gaveta de borra de café', 2),
    ('limpar bancada barista', 3),
    ('conferir itens no carrinho', 4),
    ('esvaziar cuba de café e moer descarte', 5),
    ('virar placa', 6),
    ('limpar garrafa térmica', 7),
    ('deixar maquininhas carregando', 8),
    ('limpar máquina de café', 9),
    ('tirar lixo do café', 10),
    ('atualizar encomendas de bolo no vidro', 11),
    ('enviar foto estoque de pães de mel', 12),
    ('cadastrar novos pedidos no NOTION', 13),
    ('fechar caixa', 14),
    ('contar pães de mel', 15),
    ('finalizar comandas no takeat', 16),
    ('guardar bolinho de mel', 17),
    ('limpar grade máquina de café', 18),
    ('desligar moinho de café', 19),
    ('limpar gaveta bate borra', 20),
    ('desligar máquina de café', 21),
    ('desligar ar condicionado', 22),
    ('desligar cortina de vento', 23),
    ('tirar galão descarte', 24),
    ('guardar produtos na geladeira', 25)
  )
  insert into chk_tasks (list_id, text, sort_order)
  select list_fechamento_26, txt, ord from fechamento_tasks;

  -- Colaboradores
  insert into chk_employees (store_id, name, sort_order) values
    (store_248, 'Maria', 0),
    (store_248, 'Karla', 1),
    (store_26, 'Thamiris', 0),
    (store_26, 'Raíssa', 1);

  raise notice 'Seed concluído com sucesso.';
end;
$$;
