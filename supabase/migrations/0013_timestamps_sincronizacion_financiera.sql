-- Keeps locally maintained synchronization timestamps available to the
-- browser client's upserts for savings goals and category budgets.
alter table public.metas
  add column if not exists actualizado_en timestamptz not null default now();

alter table public.presupuestos
  add column if not exists actualizado_en timestamptz not null default now();
