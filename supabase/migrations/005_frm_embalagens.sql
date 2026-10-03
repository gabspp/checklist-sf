-- ============================================================
-- Formulário "Estoque Embalagens" — nas duas lojas
-- Reaproveita o formulário já criado pelo admin (se existir) e só
-- insere seções/itens se ele ainda estiver vazio (pode rodar de novo
-- sem duplicar). Executar no SQL Editor do Supabase
-- ============================================================
do $$
declare
  store_248 uuid;
  store_26 uuid;
  target_store uuid;
  v_form uuid;
  v_sec uuid;
  next_order int;
begin
  select id into store_248 from stores where name ilike '%248%' limit 1;
  select id into store_26 from stores where name ilike '%26%' and name not ilike '%248%' limit 1;

  if store_248 is null or store_26 is null then
    raise notice 'Lojas não encontradas — verifique os nomes na tabela stores e ajuste o seed.';
    return;
  end if;

  foreach target_store in array array[store_248, store_26]
  loop
    select id into v_form from frm_forms
    where store_id = target_store and name ilike 'estoque embalagens'
    limit 1;

    if v_form is null then
      select coalesce(max(sort_order) + 1, 0) into next_order from frm_forms where store_id = target_store;

      insert into frm_forms (store_id, name, sort_order)
      values (target_store, 'Estoque embalagens', next_order)
      returning id into v_form;
    end if;

    if exists (select 1 from frm_sections where form_id = v_form) then
      raise notice 'Loja % já tem seções no formulário Estoque embalagens — seed pulado.', target_store;
      continue;
    end if;

    -- Caixas
    insert into frm_sections (form_id, name, sort_order) values (v_form, 'Caixas', 0)
    returning id into v_sec;

    with items(txt, ord) as (values
      ('Caixa de 3 — base', 0),
      ('Caixa de 3 — tampa', 1),
      ('Caixa de 3 — forro', 2),
      ('Caixa de 6 — base', 3),
      ('Caixa de 6 — tampa', 4),
      ('Caixa de 6 — forro', 5),
      ('Caixa de 9 — base', 6),
      ('Caixa de 9 — tampa', 7),
      ('Caixa de 3 transparente — base', 8),
      ('Caixa de 3 transparente — tampa', 9),
      ('Caixa de 15 — base', 10),
      ('Caixa de 15 — tampa', 11),
      ('Caixa de 50', 12),
      ('Caixa de barrinha', 13),
      ('Caixa de bolo G', 14)
    )
    insert into frm_items (section_id, name, sort_order)
    select v_sec, txt, ord from items;

    -- Sacolas e Sacos
    insert into frm_sections (form_id, name, sort_order) values (v_form, 'Sacolas e Sacos', 1)
    returning id into v_sec;

    with items(txt, ord) as (values
      ('Sacola G', 0),
      ('Sacola G (pacote fechado)', 1),
      ('Sacola P', 2),
      ('Sacola P (pacote fechado)', 3),
      ('Sacola GG', 4),
      ('Sacola GG (pacote)', 5),
      ('Sacola PP (pesar)', 6),
      ('Saco iFood', 7),
      ('Saco crocante', 8)
    )
    insert into frm_items (section_id, name, sort_order)
    select v_sec, txt, ord from items;

    -- Embalagens
    insert into frm_sections (form_id, name, sort_order) values (v_form, 'Embalagens', 2)
    returning id into v_sec;

    with items(txt, ord) as (values
      ('Embalagem de fatia — base', 0),
      ('Embalagem de fatia — tampa', 1),
      ('Embalagem bolo especiarias — base', 2),
      ('Embalagem bolo especiarias — tampa', 3),
      ('Embalagem bolo G — base', 4),
      ('Embalagem bolo G — tampa', 5),
      ('Embalagem bolo P — base', 6),
      ('Embalagem bolo P — tampa', 7),
      ('Base laminada G', 8),
      ('Base laminada P', 9)
    )
    insert into frm_items (section_id, name, sort_order)
    select v_sec, txt, ord from items;

    -- Copos, Canudos e Guardanapos
    insert into frm_sections (form_id, name, sort_order) values (v_form, 'Copos, Canudos e Guardanapos', 3)
    returning id into v_sec;

    with items(txt, ord) as (values
      ('Copo duplo P', 0),
      ('Copo duplo P (pacote)', 1),
      ('Copo duplo G', 2),
      ('Copo duplo G (pacote)', 3),
      ('Copo kraft simples', 4),
      ('Copo kraft simples (pacote)', 5),
      ('Copo de mate', 6),
      ('Copo de mate (pacote)', 7),
      ('Canudo', 8),
      ('Guardanapo (pesar)', 9)
    )
    insert into frm_items (section_id, name, sort_order)
    select v_sec, txt, ord from items;
  end loop;

  raise notice 'Seed de Estoque embalagens concluído.';
end;
$$;
