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

create or replace function public.limpiar_limites_busqueda_antiguos()
returns void
language sql
security definer set search_path = public
as $$
  delete from public.limites_solicitudes_busqueda where creado_en < now() - interval '7 days';
$$;
