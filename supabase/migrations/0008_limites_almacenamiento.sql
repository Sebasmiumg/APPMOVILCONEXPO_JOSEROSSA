-- Los buckets avatares/comprobantes (0002_almacenamiento.sql) no tenían límite
-- de tamaño ni de tipo de archivo: la ownership por carpeta ya evita que un
-- usuario toque los archivos de otro, pero nada le impedía subir archivos
-- arbitrariamente grandes a su propia carpeta (abuso de costo de storage) ni
-- de un tipo inesperado.

update storage.buckets
set file_size_limit = 5 * 1024 * 1024, -- 5 MB, de sobra para una foto de perfil
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatares';

update storage.buckets
set file_size_limit = 10 * 1024 * 1024, -- 10 MB, de sobra para una foto/PDF de comprobante
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'comprobantes';
