-- Los avatares pueden contener información personal. Requiere acceso autenticado
-- y limita lectura/escritura a la carpeta del usuario propietario.
update storage.buckets
set public = false
where id = 'avatares';

drop policy if exists "Avatares: lectura pública" on storage.objects;
drop policy if exists "Avatares: el usuario lee su propia carpeta" on storage.objects;

create policy "Avatares: el usuario lee su propia carpeta" on storage.objects
  for select using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
