-- Registro de solicitudes de búsqueda web transparente (§19), usado por la Edge
-- Function busqueda-recomendaciones para aplicar un límite diario por usuario.
create table if not exists public.limites_solicitudes_busqueda (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now()
);

alter table public.limites_solicitudes_busqueda enable row level security;

create policy "Límites de búsqueda propios" on public.limites_solicitudes_busqueda for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create index if not exists idx_limites_busqueda_usuario_fecha on public.limites_solicitudes_busqueda(usuario_id, creado_en);

-- Límite diario atómico, ligado a la identidad verificada del JWT.
create or replace function public.registrar_solicitud_busqueda()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario uuid := auth.uid();
  cantidad bigint;
begin
  if usuario is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(usuario::text || ':busqueda', 0));
  select count(*) into cantidad from public.limites_solicitudes_busqueda
    where usuario_id = usuario and creado_en >= now() - interval '24 hours';
  if cantidad >= 10 then return false; end if;
  insert into public.limites_solicitudes_busqueda(usuario_id) values (usuario);
  return true;
end;
$$;
revoke all on function public.registrar_solicitud_busqueda() from public, anon;
grant execute on function public.registrar_solicitud_busqueda() to authenticated;

create or replace function public.limpiar_limites_busqueda_antiguos()
returns void
language sql
security definer set search_path = ''
as $$
  delete from public.limites_solicitudes_busqueda where creado_en < now() - interval '7 days';
$$;
