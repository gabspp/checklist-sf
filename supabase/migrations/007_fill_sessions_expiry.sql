-- ============================================================
-- Expiração diária das sessões de preenchimento
-- Cada sessão vale só para o dia em que foi aberta (fuso de Brasília).
-- No dia seguinte uma nova sessão é criada do zero.
-- Executar no SQL Editor do Supabase (depois da 006)
-- ============================================================

-- Dia da sessão (dia local de quem abriu)
alter table fill_sessions add column if not exists day date;
update fill_sessions
  set day = (started_at at time zone 'America/Sao_Paulo')::date
  where day is null;
alter table fill_sessions alter column day set not null;
alter table fill_sessions alter column day set default ((now() at time zone 'America/Sao_Paulo')::date);

-- Novo status: expirada (sessão de um dia anterior ainda aberta)
alter table fill_sessions drop constraint if exists fill_sessions_status_check;
alter table fill_sessions add constraint fill_sessions_status_check
  check (status in ('open', 'submitted', 'discarded', 'expired'));

-- Sessões de dias anteriores que ainda estavam abertas passam a expiradas
update fill_sessions
  set status = 'expired', updated_at = now()
  where status = 'open'
    and day < (now() at time zone 'America/Sao_Paulo')::date;

-- Uma sessão aberta por lista/formulário + loja + dia
drop index if exists fill_sessions_one_open_idx;
create unique index fill_sessions_one_open_idx
  on fill_sessions (kind, ref_id, store_id, day)
  where status = 'open';
