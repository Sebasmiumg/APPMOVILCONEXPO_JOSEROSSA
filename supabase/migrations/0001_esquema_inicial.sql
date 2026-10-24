-- MiPresupuesto — esquema inicial de Supabase (Postgres)
-- Corresponde a AGENTS.md §22. Cada tabla privada tiene Row Level Security
-- habilitado: un usuario únicamente puede leer o modificar sus propios datos.

-- ============================================================================
-- PERFILES
-- ============================================================================
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  correo text not null,
  tipo_correo text check (tipo_correo in ('personal', 'institucional', 'organizacional')),
  dominio_correo text,
  idioma text not null default 'es' check (idioma in ('es', 'en', 'zh', 'hi', 'ar')),
  tema text not null default 'oscuro' check (tema in ('oscuro', 'claro')),
  moneda_principal text not null default 'GTQ',
  configuracion_completa boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.perfiles enable row level security;

create policy "Los usuarios ven su propio perfil" on public.perfiles
  for select using (auth.uid() = id);
create policy "Los usuarios actualizan su propio perfil" on public.perfiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Los usuarios insertan su propio perfil" on public.perfiles
  for insert with check (auth.uid() = id);

-- Crea automáticamente un perfil cuando se registra un nuevo usuario en Supabase Auth.
create or replace function public.manejar_usuario_nuevo()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.perfiles (id, correo, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'nombre', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute procedure public.manejar_usuario_nuevo();

-- ============================================================================
-- CUENTAS
-- ============================================================================
create table if not exists public.cuentas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('efectivo', 'cuentaBancaria', 'cuentaAhorro', 'tarjetaCredito', 'negocio', 'billeteraDigital')),
  moneda text not null default 'GTQ',
  saldo_inicial numeric(14, 2) not null default 0,
  color text,
  icono text,
  activa boolean not null default true,
  creada_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.cuentas enable row level security;
create policy "Cuentas propias" on public.cuentas for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create index if not exists idx_cuentas_usuario on public.cuentas(usuario_id);

-- ============================================================================
-- CATEGORIAS (globales cuando usuario_id es NULL, personalizadas si no)
-- ============================================================================
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  nombre_clave_traduccion text,
  nombre_personalizado text,
  icono text not null,
  color text not null,
  activa boolean not null default true,
  actualizado_en timestamptz not null default now()
);

alter table public.categorias enable row level security;
create policy "Ver categorías globales o propias" on public.categorias
  for select using (usuario_id is null or auth.uid() = usuario_id);
create policy "Crear categorías propias" on public.categorias
  for insert with check (auth.uid() = usuario_id);
create policy "Editar categorías propias" on public.categorias
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
create policy "Eliminar categorías propias" on public.categorias
  for delete using (auth.uid() = usuario_id);

create index if not exists idx_categorias_usuario on public.categorias(usuario_id);
create index if not exists idx_categorias_tipo on public.categorias(tipo);

-- ============================================================================
-- MOVIMIENTOS
-- ============================================================================
create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  cuenta_id uuid not null references public.cuentas(id) on delete cascade,
  cuenta_destino_id uuid references public.cuentas(id) on delete set null,
  movimiento_relacionado_id uuid references public.movimientos(id) on delete set null,
  tipo text not null check (tipo in ('ingreso', 'gasto', 'transferencia', 'ajuste')),
  monto numeric(14, 2) not null check (monto >= 0),
  categoria_id uuid references public.categorias(id) on delete set null,
  descripcion text,
  notas text,
  fecha_movimiento timestamptz not null,
  comprobante_url text,
  recurrente boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.movimientos enable row level security;
create or replace function public.movimiento_relacionado_es_propio(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.movimientos m
    where m.id = p_id and m.usuario_id = auth.uid()
  );
$$;
revoke all on function public.movimiento_relacionado_es_propio(uuid) from public, anon;
grant execute on function public.movimiento_relacionado_es_propio(uuid) to authenticated;

create policy "Movimientos propios" on public.movimientos for all
  using (auth.uid() = usuario_id) with check (
    auth.uid() = usuario_id
    and exists (
      select 1 from public.cuentas c
      where c.id = movimientos.cuenta_id and c.usuario_id = auth.uid()
    )
    and (movimientos.cuenta_destino_id is null or exists (
      select 1 from public.cuentas c
      where c.id = movimientos.cuenta_destino_id and c.usuario_id = auth.uid()
    ))
    and (movimientos.movimiento_relacionado_id is null
      or public.movimiento_relacionado_es_propio(movimientos.movimiento_relacionado_id))
    and (movimientos.categoria_id is null or exists (
      select 1 from public.categorias c
      where c.id = movimientos.categoria_id
        and (c.usuario_id is null or c.usuario_id = auth.uid())
    ))
  );

create index if not exists idx_movimientos_usuario on public.movimientos(usuario_id);
create index if not exists idx_movimientos_cuenta on public.movimientos(cuenta_id);
create index if not exists idx_movimientos_fecha on public.movimientos(fecha_movimiento);
create index if not exists idx_movimientos_categoria on public.movimientos(categoria_id);

-- ============================================================================
-- PRESUPUESTOS
-- ============================================================================
create table if not exists public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  periodo text not null,
  limite numeric(14, 2) not null check (limite >= 0),
  porcentaje_alerta int not null default 80,
  creado_en timestamptz not null default now()
);

alter table public.presupuestos enable row level security;
create policy "Presupuestos propios" on public.presupuestos for all
  using (auth.uid() = usuario_id) with check (
    auth.uid() = usuario_id
    and exists (
      select 1 from public.categorias c
      where c.id = presupuestos.categoria_id
        and (c.usuario_id is null or c.usuario_id = auth.uid())
    )
  );

create index if not exists idx_presupuestos_usuario on public.presupuestos(usuario_id);
create index if not exists idx_presupuestos_periodo on public.presupuestos(periodo);

-- ============================================================================
-- METAS Y APORTES
-- ============================================================================
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  cuenta_id uuid references public.cuentas(id) on delete set null,
  nombre text not null,
  monto_objetivo numeric(14, 2) not null check (monto_objetivo > 0),
  monto_actual numeric(14, 2) not null default 0,
  fecha_objetivo date,
  estado text not null default 'activa' check (estado in ('activa', 'completada', 'archivada')),
  creada_en timestamptz not null default now()
);

alter table public.metas enable row level security;
create policy "Metas propias" on public.metas for all
  using (auth.uid() = usuario_id) with check (
    auth.uid() = usuario_id
    and (metas.cuenta_id is null or exists (
      select 1 from public.cuentas c
      where c.id = metas.cuenta_id and c.usuario_id = auth.uid()
    ))
  );

create index if not exists idx_metas_usuario on public.metas(usuario_id);

create table if not exists public.aportes_meta (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas(id) on delete cascade,
  monto numeric(14, 2) not null check (monto > 0),
  fecha timestamptz not null default now(),
  nota text
);

alter table public.aportes_meta enable row level security;
create policy "Aportes de metas propias" on public.aportes_meta for all
  using (exists (select 1 from public.metas m where m.id = meta_id and m.usuario_id = auth.uid()))
  with check (exists (select 1 from public.metas m where m.id = meta_id and m.usuario_id = auth.uid()));

create index if not exists idx_aportes_meta on public.aportes_meta(meta_id);

-- ============================================================================
-- ASISTENTE: CONVERSACIONES Y MENSAJES (preparado para la Fase 6)
-- ============================================================================
create table if not exists public.conversaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text,
  creada_en timestamptz not null default now()
);

alter table public.conversaciones enable row level security;
create policy "Conversaciones propias" on public.conversaciones for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create table if not exists public.mensajes_chat (
  id uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references public.conversaciones(id) on delete cascade,
  rol text not null check (rol in ('usuario', 'asistente')),
  contenido text not null,
  metadatos jsonb,
  creado_en timestamptz not null default now()
);

alter table public.mensajes_chat enable row level security;
create policy "Mensajes de conversaciones propias" on public.mensajes_chat for all
  using (exists (select 1 from public.conversaciones c where c.id = conversacion_id and c.usuario_id = auth.uid()))
  with check (exists (select 1 from public.conversaciones c where c.id = conversacion_id and c.usuario_id = auth.uid()));

create index if not exists idx_mensajes_conversacion on public.mensajes_chat(conversacion_id);

-- ============================================================================
-- RECOMENDACIONES Y FUENTES (preparado para la Fase 6)
-- ============================================================================
create table if not exists public.recomendaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  contenido text not null,
  nivel_riesgo text check (nivel_riesgo in ('bajo', 'medio', 'alto')),
  generada_en timestamptz not null default now(),
  vence_en timestamptz
);

alter table public.recomendaciones enable row level security;
create policy "Recomendaciones propias" on public.recomendaciones for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create table if not exists public.fuentes_recomendacion (
  id uuid primary key default gen_random_uuid(),
  recomendacion_id uuid not null references public.recomendaciones(id) on delete cascade,
  titulo text not null,
  entidad text,
  fecha_publicacion date,
  fecha_consulta timestamptz not null default now(),
  url text,
  tipo_fuente text
);

alter table public.fuentes_recomendacion enable row level security;
create policy "Fuentes de recomendaciones propias" on public.fuentes_recomendacion for all
  using (exists (select 1 from public.recomendaciones r where r.id = recomendacion_id and r.usuario_id = auth.uid()))
  with check (exists (select 1 from public.recomendaciones r where r.id = recomendacion_id and r.usuario_id = auth.uid()));
