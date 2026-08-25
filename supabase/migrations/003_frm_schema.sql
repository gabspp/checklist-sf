-- ============================================================
-- Formulários — Módulo Santo Favo OS
-- Igual em espírito aos checklists (chk_*), mas cada item tem
-- dois campos de resposta: Quantidade (numérico) e Comprar (checkbox)
-- Executar no SQL Editor do Supabase
-- ============================================================

-- FORMULÁRIOS (por loja, igual chk_lists)
create table if not exists frm_forms (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) not null,
  name text not null,
  active boolean default true not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- SEÇÕES (categorias dentro de um formulário)
create table if not exists frm_sections (
  id uuid default uuid_generate_v4() primary key,
  form_id uuid references frm_forms(id) on delete cascade not null,
  name text not null,
  active boolean default true not null,
  sort_order int default 0
);

-- ITENS (produtos dentro de uma seção)
create table if not exists frm_items (
  id uuid default uuid_generate_v4() primary key,
  section_id uuid references frm_sections(id) on delete cascade not null,
  name text not null,
  active boolean default true not null,
  sort_order int default 0
);

-- SUBMISSÕES (cabeçalho de um preenchimento)
create table if not exists frm_submissions (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references stores(id) not null,
  form_id uuid references frm_forms(id) not null,
  form_name text not null,
  employee_id uuid references chk_employees(id),
  employee_name text not null,
  comment text,
  item_count int not null,
  filled_count int not null,
  submitted_at timestamptz default now()
);

-- ITENS DA SUBMISSÃO (snapshot do que foi respondido)
create table if not exists frm_submission_items (
  id uuid default uuid_generate_v4() primary key,
  submission_id uuid references frm_submissions(id) on delete cascade not null,
  section_name text not null,
  item_name text not null,
  quantity numeric,
  comprar boolean default false not null
);

create index if not exists frm_submissions_submitted_at_idx on frm_submissions (submitted_at);
create index if not exists frm_submissions_store_form_idx on frm_submissions (store_id, form_id);

-- ============================================================
-- RLS
-- ============================================================
alter table frm_forms enable row level security;
alter table frm_sections enable row level security;
alter table frm_items enable row level security;
alter table frm_submissions enable row level security;
alter table frm_submission_items enable row level security;

-- Leitura pública (anon) — para preenchimento sem login
create policy "frm_forms_read_public" on frm_forms for select using (true);
create policy "frm_sections_read_public" on frm_sections for select using (true);
create policy "frm_items_read_public" on frm_items for select using (true);

-- Insert de submissão público (anon pode gravar)
create policy "frm_submissions_insert_public" on frm_submissions for insert with check (true);
create policy "frm_submission_items_insert_public" on frm_submission_items for insert with check (true);

-- CRUD completo só para usuários autenticados (admin)
create policy "frm_forms_admin" on frm_forms for all using (auth.role() = 'authenticated');
create policy "frm_sections_admin" on frm_sections for all using (auth.role() = 'authenticated');
create policy "frm_items_admin" on frm_items for all using (auth.role() = 'authenticated');
create policy "frm_submissions_admin_read" on frm_submissions for select using (auth.role() = 'authenticated');
create policy "frm_submissions_admin_delete" on frm_submissions for delete using (auth.role() = 'authenticated');
create policy "frm_submission_items_admin" on frm_submission_items for select using (auth.role() = 'authenticated');

-- ============================================================
-- SEED — formulário "Estoque Produtos de Limpeza" nas duas lojas
-- ============================================================
do $$
declare
  store_248 uuid;
  store_26 uuid;
  target_store uuid;
  new_form uuid;
  sec_limpeza uuid;
  sec_pragas uuid;
begin
  select id into store_248 from stores where name ilike '%248%' limit 1;
  select id into store_26 from stores where name ilike '%26%' and name not ilike '%248%' limit 1;

  if store_248 is null or store_26 is null then
    raise notice 'Lojas não encontradas — verifique os nomes na tabela stores e ajuste o seed.';
    return;
  end if;

  foreach target_store in array array[store_248, store_26]
  loop
    insert into frm_forms (store_id, name, sort_order)
    values (target_store, 'Estoque Produtos de Limpeza', 0)
    returning id into new_form;

    -- Produtos de Limpeza
    insert into frm_sections (form_id, name, sort_order) values (new_form, 'Produtos de Limpeza', 0)
    returning id into sec_limpeza;

    with items(txt, ord) as (values
      ('Detergente', 0),
      ('Água sanitária', 1),
      ('Desinfetante', 2),
      ('Álcool 70', 3),
      ('Limpa alumínio', 4),
      ('Sabão para mãos — cozinha', 5),
      ('Sabão para mãos — banheiro/salão', 6),
      ('Limpador multiuso', 7),
      ('Álcool gel', 8)
    )
    insert into frm_items (section_id, name, sort_order)
    select sec_limpeza, txt, ord from items;

    -- Controle de Pragas
    insert into frm_sections (form_id, name, sort_order) values (new_form, 'Controle de Pragas', 1)
    returning id into sec_pragas;

    with items(txt, ord) as (values
      ('Adesivo armadilha para moscas', 0),
      ('Armadilha de batata', 1),
      ('Inseticida spray', 2),
      ('Antimofo', 3)
    )
    insert into frm_items (section_id, name, sort_order)
    select sec_pragas, txt, ord from items;

    -- Utensílios e Materiais
    insert into frm_sections (form_id, name, sort_order) values (new_form, 'Utensílios e Materiais', 2)
    returning id into sec_pragas;

    with items(txt, ord) as (values
      ('Esponja', 0),
      ('Luva de limpeza', 1),
      ('Avental', 2),
      ('Mop de cabelo', 3),
      ('Vassoura', 4),
      ('Pá de lixo', 5),
      ('Balde', 6),
      ('Rodo', 7),
      ('Escova de canto', 8),
      ('Papel interfolha', 9),
      ('Papel higiênico', 10),
      ('Pano de prato', 11),
      ('Pano de chão', 12),
      ('Pano microfibra (bar)', 13),
      ('Saco de lixo grande', 14),
      ('Saco de lixo médio', 15)
    )
    insert into frm_items (section_id, name, sort_order)
    select sec_pragas, txt, ord from items;
  end loop;

  raise notice 'Seed de formulários concluído com sucesso.';
end;
$$;
