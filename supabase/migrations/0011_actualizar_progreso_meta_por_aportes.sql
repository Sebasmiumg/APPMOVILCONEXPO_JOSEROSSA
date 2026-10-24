-- Mantiene el progreso de la meta consistente cuando los aportes llegan desde
-- la app, Capacitaciones o cualquier cliente autorizado de la API.
create or replace function public.recalcular_progreso_meta_por_aporte()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta_id uuid;
  v_delta numeric(14, 2);
begin
  if tg_op = 'INSERT' then
    v_meta_id := new.meta_id;
    v_delta := new.monto;
  elsif tg_op = 'DELETE' then
    v_meta_id := old.meta_id;
    v_delta := -old.monto;
  else
    if old.meta_id = new.meta_id then
      v_meta_id := new.meta_id;
      v_delta := new.monto - old.monto;
    else
      update public.metas
      set monto_actual = greatest(0, round(monto_actual - old.monto, 2)),
          estado = case
            when estado = 'archivada' then estado
            when greatest(0, round(monto_actual - old.monto, 2)) >= monto_objetivo then 'completada'
            else 'activa'
          end
      where id = old.meta_id;
      v_meta_id := new.meta_id;
      v_delta := new.monto;
    end if;
  end if;

  update public.metas
  set monto_actual = greatest(0, round(monto_actual + v_delta, 2)),
      estado = case
        when estado = 'archivada' then estado
        when greatest(0, round(monto_actual + v_delta, 2)) >= monto_objetivo then 'completada'
        else 'activa'
      end
  where id = v_meta_id;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.recalcular_progreso_meta_por_aporte() from public, anon, authenticated;
drop trigger if exists aportes_meta_actualizan_progreso on public.aportes_meta;
create trigger aportes_meta_actualizan_progreso
after insert or update or delete on public.aportes_meta
for each row execute function public.recalcular_progreso_meta_por_aporte();
