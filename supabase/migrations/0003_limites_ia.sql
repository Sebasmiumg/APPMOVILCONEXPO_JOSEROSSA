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

-- Housekeeping: elimina registros de más de 24 horas para no acumular filas indefinidamente.
create or replace function public.limpiar_limites_ia_antiguos()
returns void
language sql
security definer set search_path = public
as $$
  delete from public.limites_solicitudes_ia where creado_en < now() - interval '1 day';
$$;
