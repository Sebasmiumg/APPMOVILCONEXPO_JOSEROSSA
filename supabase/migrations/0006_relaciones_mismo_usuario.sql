-- Impide que un usuario vincule sus movimientos/metas/presupuestos con
-- cuentas, movimientos relacionados o categorías privadas de otra persona.
-- Mantiene permitidas las categorías globales (usuario_id IS NULL).

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

drop policy if exists "Movimientos propios" on public.movimientos;
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

drop policy if exists "Presupuestos propios" on public.presupuestos;
create policy "Presupuestos propios" on public.presupuestos for all
  using (auth.uid() = usuario_id) with check (
    auth.uid() = usuario_id
    and exists (
      select 1 from public.categorias c
      where c.id = presupuestos.categoria_id
        and (c.usuario_id is null or c.usuario_id = auth.uid())
    )
  );

drop policy if exists "Metas propias" on public.metas;
create policy "Metas propias" on public.metas for all
  using (auth.uid() = usuario_id) with check (
    auth.uid() = usuario_id
    and (metas.cuenta_id is null or exists (
      select 1 from public.cuentas c
      where c.id = metas.cuenta_id and c.usuario_id = auth.uid()
    ))
  );
