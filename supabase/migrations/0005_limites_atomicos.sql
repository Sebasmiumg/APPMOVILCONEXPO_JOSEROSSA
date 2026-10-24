-- Refuerza los límites ya instalados sin depender de volver a ejecutar
-- migraciones anteriores. Las escrituras se hacen exclusivamente vía RPC.
drop policy if exists "Límites propios" on public.limites_solicitudes_ia;
create policy "Leer límites propios" on public.limites_solicitudes_ia
  for select using (auth.uid() = usuario_id);

drop policy if exists "Límites de búsqueda propios" on public.limites_solicitudes_busqueda;
create policy "Leer límites de búsqueda propios" on public.limites_solicitudes_busqueda
  for select using (auth.uid() = usuario_id);

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

create or replace function public.limpiar_limites_ia_antiguos()
returns void language sql security definer set search_path = ''
as $$ delete from public.limites_solicitudes_ia where creado_en < now() - interval '1 day'; $$;
revoke all on function public.limpiar_limites_ia_antiguos() from public, anon, authenticated;
grant execute on function public.limpiar_limites_ia_antiguos() to service_role;

create or replace function public.limpiar_limites_busqueda_antiguos()
returns void language sql security definer set search_path = ''
as $$ delete from public.limites_solicitudes_busqueda where creado_en < now() - interval '7 days'; $$;
revoke all on function public.limpiar_limites_busqueda_antiguos() from public, anon, authenticated;
grant execute on function public.limpiar_limites_busqueda_antiguos() to service_role;

create or replace function public.manejar_usuario_nuevo()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.perfiles (id, correo, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nombre', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
