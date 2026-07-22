-- Buckets de Supabase Storage para foto de perfil y comprobantes de movimientos.
-- Cada usuario solo puede leer y escribir archivos dentro de su propia carpeta
-- (la primera parte de la ruta debe ser su auth.uid()).

insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "Avatares: lectura pública" on storage.objects
  for select using (bucket_id = 'avatares');

create policy "Avatares: el usuario escribe su propia carpeta" on storage.objects
  for insert with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatares: el usuario actualiza su propia carpeta" on storage.objects
  for update using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatares: el usuario elimina su propia carpeta" on storage.objects
  for delete using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Comprobantes: el usuario lee su propia carpeta" on storage.objects
  for select using (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Comprobantes: el usuario escribe su propia carpeta" on storage.objects
  for insert with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Comprobantes: el usuario elimina su propia carpeta" on storage.objects
  for delete using (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);
