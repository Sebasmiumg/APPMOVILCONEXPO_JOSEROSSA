-- Registro de solicitudes al asistente con IA (Nivel 2), usado por la Edge Function
-- asistente-ia para aplicar un límite de solicitudes por hora por usuario.
create table if not exists public.limites_solicitudes_ia (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now()
);

alter table public.limites_solicitudes_ia enable row level security;

-- Solo la propia Edge Function (con el JWT del usuario) puede insertar o consultar
-- sus propias solicitudes; nadie puede leer los límites de otro usuario.
create policy "Límites propios" on public.limites_solicitudes_ia for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create index if not exists idx_limites_ia_usuario_fecha on public.limites_solicitudes_ia(usuario_id, creado_en);

-- Límite atómico: evita que solicitudes concurrentes superen el cupo y falla
-- cerrado en caso de errores de base de datos. La identidad viene del JWT.
create or replace function public.registrar_solicitud_ia()
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
  perform pg_advisory_xact_lock(hashtextextended(usuario::text || ':ia', 0));
  select count(*) into cantidad from public.limites_solicitudes_ia
    where usuario_id = usuario and creado_en >= now() - interval '1 hour';
  if cantidad >= 15 then return false; end if;
  insert into public.limites_solicitudes_ia(usuario_id) values (usuario);
  return true;
end;
$$;
revoke all on function public.registrar_solicitud_ia() from public, anon;
grant execute on function public.registrar_solicitud_ia() to authenticated;

-- Housekeeping: elimina registros de más de 24 horas para no acumular filas indefinidamente.
create or replace function public.limpiar_limites_ia_antiguos()
returns void
language sql
security definer set search_path = ''
as $$
  delete from public.limites_solicitudes_ia where creado_en < now() - interval '1 day';
$$;
