#!/bin/bash
set -e
cd /var/app/current

# La base vive en /var/app/db (fuera de /var/app/current, que Elastic
# Beanstalk reemplaza por completo en cada deploy) para que los datos
# sobrevivan entre despliegues. DB_DATABASE apunta ahí (.ebextensions).
mkdir -p /var/app/db

PRIMERA_VEZ=0
if [ ! -f /var/app/db/database.sqlite ]; then
  PRIMERA_VEZ=1
  touch /var/app/db/database.sqlite
fi
# SQLite necesita escribir en la carpeta contenedora (journal/wal), no solo
# en el archivo; sin esto PHP-FPM (usuario webapp) no puede abrir la base.
chown webapp:webapp /var/app/db /var/app/db/database.sqlite
chmod 775 /var/app/db
chmod 664 /var/app/db/database.sqlite

# El ZIP excluye el contenido de estas carpetas (para no subir cache vieja),
# así que hay que recrearlas en cada despliegue o Laravel falla con
# "Please provide a valid cache path" al no encontrarlas.
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/testing storage/framework/views storage/logs bootstrap/cache

# PHP-FPM corre como webapp:webapp; sin el chown, Laravel no puede escribir
# logs, cache de vistas ni bootstrap/cache, y termina en 500 al arrancar.
chown -R webapp:webapp storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# migrate (no migrate:fresh): aplica solo lo pendiente y nunca borra datos
# ya guardados por usuarios reales entre un deploy y el siguiente.
php artisan migrate --force
if [ "$PRIMERA_VEZ" = "1" ]; then
  php artisan db:seed --force
fi
php artisan usuarios:crear-inicial
php artisan usuarios:crear-prueba
php artisan config:cache
