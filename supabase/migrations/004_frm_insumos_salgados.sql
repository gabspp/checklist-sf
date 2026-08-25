-- ============================================================
-- Formulário "Estoque Insumos para Salgados" — nas duas lojas
-- Executar no SQL Editor do Supabase
-- ============================================================
do $$
declare
  store_248 uuid;
  store_26 uuid;
  target_store uuid;
  new_form uuid;
  next_order int;
  sec uuid;
begin
  select id into store_248 from stores where name ilike '%248%' limit 1;
  select id into store_26 from stores where name ilike '%26%' and name not ilike '%248%' limit 1;

  if store_248 is null or store_26 is null then
    raise notice 'Lojas não encontradas — verifique os nomes na tabela stores e ajuste o seed.';
    return;
  end if;

  foreach target_store in array array[store_248, store_26]
  loop
    select coalesce(max(sort_order) + 1, 0) into next_order from frm_forms where store_id = target_store;

    insert into frm_forms (store_id, name, sort_order)
    values (target_store, 'Estoque Insumos para Salgados', next_order)
    returning id into new_form;

    -- Queijos e Laticínios
    insert into frm_sections (form_id, name, sort_order) values (new_form, 'Queijos e Laticínios', 0)
    returning id into sec;

    with items(txt, ord) as (values
      ('Queijo mussarela', 0),
      ('Queijo meia cura', 1),
      ('Queijo parmesão', 2),
      ('Queijo provolone', 3),
      ('Requeijão', 4),
      ('Manteiga com sal', 5)
    )
    insert into frm_items (section_id, name, sort_order)
    select sec, txt, ord from items;

    -- Temperos e Hortifruti
    insert into frm_sections (form_id, name, sort_order) values (new_form, 'Temperos e Hortifruti', 1)
    returning id into sec;

    with items(txt, ord) as (values
      ('Alho', 0),
      ('Cebola', 1),
      ('Alho poró', 2),
      ('Manjericão', 3),
      ('Limão', 4),
      ('Cogumelo shiitake', 5)
    )
    insert into frm_items (section_id, name, sort_order)
    select sec, txt, ord from items;

    -- Mercearia
    insert into frm_sections (form_id, name, sort_order) values (new_form, 'Mercearia', 2)
    returning id into sec;

    with items(txt, ord) as (values
      ('Azeite', 0),
      ('Pimenta do reino', 1),
      ('Tomate em lata', 2),
      ('Maionese', 3),
      ('Bacon', 4)
    )
    insert into frm_items (section_id, name, sort_order)
    select sec, txt, ord from items;

    -- Pães
    insert into frm_sections (form_id, name, sort_order) values (new_form, 'Pães', 3)
    returning id into sec;

    with items(txt, ord) as (values
      ('Sourdough', 0),
      ('Brioche', 1),
      ('Ciabatta', 2)
    )
    insert into frm_items (section_id, name, sort_order)
    select sec, txt, ord from items;
  end loop;

  raise notice 'Seed de Insumos para Salgados concluído com sucesso.';
end;
$$;
