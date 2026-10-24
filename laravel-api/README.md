# MiPresupuesto API (Laravel)

API REST construida con Laravel que expone los recursos compartidos de [MiPresupuesto](../README.md): **Cuentas**, **Categorías**, **Movimientos**, **Metas** y **Presupuestos por categoría** leen y escriben en las mismas tablas Supabase que usa la app. **Presupuestos de capacitación** y el reporte mensual también se ofrecen por API. Todas las rutas se definen exclusivamente en `routes/api.php` (no se usa `web.php`).

> La sección **Capacitaciones** consume esta API en vivo usando la misma sesión Supabase que MiPresupuesto. Laravel reenvía el JWT del usuario a Supabase; las políticas RLS mantienen el aislamiento por UUID. Las categorías canónicas son globales y de solo lectura; cada usuario puede administrar sus propias categorías.

## Requisitos

- PHP 8.2+
- Composer

## Instalación

```bash
cd laravel-api
composer install
cp .env.example .env   # si no existe .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
```

El seed (`database/seeders/`) carga datos de demostración con volumen real, para poder probar la API sin partir de una base vacía:

- **5 usuarios** de demostración con nombre/correo realistas.
- **38 categorías** canónicas (26 de gasto, 12 de ingreso), las mismas que usa la app móvil en `src/base-datos/categoriasSemilla.ts`.
- **10 cuentas** (2 por usuario: efectivo + una cuenta/tarjeta/billetera distinta), cada una con su nombre indicando a qué usuario pertenece.
- **~200 movimientos** repartidos en los últimos 4 meses entre esas cuentas y categorías.
- **7-10 metas de ahorro** (1-2 por usuario) con **varios aportes** cada una, cuyo `monto_actual` se calcula sumando los aportes.
- **~20 presupuestos por categoría** (10 categorías de gasto × 2 periodos).
- **8 presupuestos de capacitación** con nombres, descripciones y estados variados.

Para regenerar todo desde cero (borra y vuelve a crear las tablas):

```bash
php artisan migrate:fresh --seed
```

## Levantar el servidor

```bash
php artisan serve
```

La API queda disponible en `http://127.0.0.1:8000/api`.

## Autenticación

Todos los recursos financieros requieren un access token Supabase válido, con correo confirmado, para una de las dos cuentas autorizadas. El endpoint de login valida las credenciales en Supabase y devuelve el access token que también pueden usar las integraciones externas:

1. `POST /api/login` con `email` y `password` → devuelve `{ "usuario": {...}, "token": "...", "expires_in": 3600, "expires_at": "2026-10-16T13:00:00+00:00" }` (la fecha real la calcula con la expiración devuelta por Supabase).
2. Enviar `Authorization: Bearer {token}` en cada petición a un recurso protegido.
3. `POST /api/logout` (autenticado) revoca el token actual.

| Método | Endpoint       | Auth requerida | Descripción                              |
| ------ | -------------- | --------------- | ------------------------------------------ |
| POST   | `/api/login`   | No              | Inicia sesión en Supabase y devuelve su access token |
| POST   | `/api/logout`  | Sí              | Cierra la sesión Supabase actual                    |
| GET    | `/api/user`    | Sí              | Devuelve el usuario autenticado                      |

Los usuarios de demostración creados por `DatosDemoSeeder` solo sirven para desarrollo local. No se aceptan como cuentas de producción ni se crean datos financieros de demostración cuando `APP_ENV=production`.

### Sesión de la aplicación normal y clientes externos

Solo `ana.lopez@example.com` y `jose.cayetano@example.com` pueden acceder a Capacitaciones y a los endpoints de esta API, tanto desde la app normal como desde aplicaciones externas. La navegación y la ruta web también ocultan y bloquean la sección para otras cuentas; Laravel vuelve a comprobar la autorización en cada endpoint.

La app normal inicia sesión en Supabase. Capacitaciones reutiliza esa misma sesión: envía el access token Supabase a Laravel, que lo valida contra Supabase Auth y enlaza el usuario por su UUID. El enlace por correo solo se permite si Supabase confirma el correo. `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` se configuran en `.ebextensions/01-laravel.config` con los mismos valores públicos del build Vercel. La migración `2026_10_15_000001_add_supabase_identity_to_users.php` debe aplicarse en el despliegue. Una sesión antigua de Sanctum sin UUID Supabase no puede consultar datos financieros.

Una aplicación externa inicia sesión con `POST /api/login` y las credenciales Supabase de Ana o José, y usa el access token devuelto en `Authorization: Bearer {access_token}`. Laravel valida el token contra el mismo proyecto Supabase y Postgres aplica el aislamiento por usuario.

No se debe solicitar una segunda contraseña a los usuarios normales dentro de Capacitaciones. Las cuentas Laravel para integraciones siguen siendo independientes, salvo que un correo confirmado de Supabase se vincule explícitamente con el mismo registro local.

En AWS, el hook de despliegue no crea cuentas de prueba si no se habilitan explícitamente. Para habilitar a Ana y José, configura `PRUEBA_USUARIOS_HABILITADOS=true` y secretos distintos `PRUEBA_ANA_PASSWORD` / `PRUEBA_JOSE_PASSWORD` (mínimo 16 caracteres) en el almacén de secretos/variables seguras de Elastic Beanstalk; el comando actualiza sus contraseñas y revoca sus tokens en cada despliegue. No reutilices las credenciales locales ni guardes las contraseñas en Git. Si la API ya desplegada usó credenciales fijas, este cambio solo las rotará cuando se despliegue con esos secretos configurados.

Notas de seguridad aplicadas:

- Los tokens expiran a las 24 horas (`config/sanctum.php` → `expiration => 1440`).
- `POST /api/login` está limitado a 5 intentos por minuto por IP (`throttle:5,1`) para mitigar fuerza bruta.
- El resto de rutas autenticadas está limitado a 60 peticiones por minuto (`throttle:60,1`).
- Los intentos de login fallidos se registran en el log de la aplicación (`storage/logs/laravel.log`) sin incluir la contraseña.
- `APP_DEBUG` debe estar en `false` fuera de desarrollo local para no exponer stack traces (ver `.env`).
- Cada registro financiero tiene `user_id`; los controladores filtran por el usuario autenticado. Los datos previos a la migración de propiedad quedan sin propietario y no se exponen a sesiones autenticadas. Revísalos y asígnalos mediante un proceso de migración aprobado antes de reactivar esos datos.

## Endpoints

> Todos los endpoints de esta sección requieren el header `Authorization: Bearer {token}` (ver sección anterior).

Recurso `movimientos` (campos: `descripcion`, `monto`, `tipo` [`ingreso`|`gasto`], `categoria`, `cuenta`, `fecha`):

| Método | Endpoint                  | Descripción                  |
| ------ | -------------------------- | ----------------------------- |
| GET    | `/api/movimientos`         | Listar todos los movimientos  |
| POST   | `/api/movimientos`         | Crear un movimiento           |
| GET    | `/api/movimientos/{id}`    | Ver un movimiento              |
| PUT    | `/api/movimientos/{id}`    | Actualizar un movimiento       |
| DELETE | `/api/movimientos/{id}`    | Eliminar un movimiento         |

Ejemplo de body para `POST`/`PUT`:

```json
{
  "descripcion": "Compra de supermercado",
  "monto": 350.75,
  "tipo": "gasto",
  "categoria": "Comida",
  "cuenta": "Efectivo",
  "fecha": "2026-08-20"
}
```

### Reporte de movimientos por mes

| Método | Endpoint                              | Descripción                                                        |
| ------ | -------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/reportes/movimientos-por-mes`    | Totales de ingresos/gastos agrupados por mes (más reciente primero) |

Acepta el query param opcional `?anio=YYYY` para filtrar un año específico. Respuesta:

```json
[
  {
    "periodo": "2026-08",
    "total_ingresos": 1000,
    "total_gastos": 300,
    "saldo_neto": 700,
    "cantidad_movimientos": 2
  }
]
```

### Presupuestos de capacitación

Recurso `presupuestos-capacitacion` (campos: `nombre`, `descripcion` opcional, `monto_asignado`, `monto_ejecutado` opcional, `fecha_inicio`, `fecha_fin` opcional, `estado` [`planificada`|`en_curso`|`finalizada`|`cancelada`]):

| Método | Endpoint                                    | Descripción                        |
| ------ | -------------------------------------------- | ------------------------------------ |
| GET    | `/api/presupuestos-capacitacion`             | Listar todos los presupuestos        |
| POST   | `/api/presupuestos-capacitacion`             | Crear un presupuesto                 |
| GET    | `/api/presupuestos-capacitacion/{id}`        | Ver un presupuesto                   |
| PUT    | `/api/presupuestos-capacitacion/{id}`        | Actualizar un presupuesto            |
| DELETE | `/api/presupuestos-capacitacion/{id}`        | Eliminar un presupuesto              |

Ejemplo de body para `POST`/`PUT`:

```json
{
  "nombre": "Capacitación de Laravel avanzado",
  "descripcion": "Taller interno para el equipo de backend",
  "monto_asignado": 1500,
  "fecha_inicio": "2026-10-01",
  "fecha_fin": "2026-10-15",
  "estado": "planificada"
}
```

### Cuentas

Recurso `cuentas` (campos: `nombre`, `tipo`, `moneda` opcional [3 letras, por defecto `GTQ`], `saldo_inicial` opcional, `color` opcional, `icono` opcional, `activa` opcional):

| Método | Endpoint             | Descripción           |
| ------ | --------------------- | ----------------------- |
| GET    | `/api/cuentas`         | Listar todas las cuentas |
| POST   | `/api/cuentas`         | Crear una cuenta         |
| GET    | `/api/cuentas/{id}`    | Ver una cuenta            |
| PUT    | `/api/cuentas/{id}`    | Actualizar una cuenta      |
| DELETE | `/api/cuentas/{id}`    | Eliminar una cuenta        |

### Categorías

Recurso `categorias` (campos: `tipo` [`ingreso`|`gasto`], `nombre`, `icono`, `color`, `activa` opcional):

| Método | Endpoint                | Descripción               |
| ------ | ------------------------- | ---------------------------- |
| GET    | `/api/categorias`          | Listar todas las categorías   |
| POST   | `/api/categorias`          | Crear una categoría            |
| GET    | `/api/categorias/{id}`     | Ver una categoría                |
| PUT    | `/api/categorias/{id}`     | Actualizar una categoría          |
| DELETE | `/api/categorias/{id}`     | Eliminar una categoría            |

### Presupuestos por categoría

Recurso `presupuestos-categoria` (campos: `categoria_id` [debe existir en `categorias`], `periodo` [`YYYY-MM`], `limite`, `porcentaje_alerta` opcional [1-100, por defecto 80]):

| Método | Endpoint                                | Descripción                    |
| ------ | ----------------------------------------- | --------------------------------- |
| GET    | `/api/presupuestos-categoria`              | Listar todos los presupuestos      |
| POST   | `/api/presupuestos-categoria`              | Crear un presupuesto                |
| GET    | `/api/presupuestos-categoria/{id}`         | Ver un presupuesto                   |
| PUT    | `/api/presupuestos-categoria/{id}`         | Actualizar un presupuesto             |
| DELETE | `/api/presupuestos-categoria/{id}`         | Eliminar un presupuesto               |

### Metas de ahorro y sus aportes

Recurso `metas` (campos: `cuenta_id` opcional [debe existir en `cuentas`], `nombre`, `monto_objetivo`, `monto_actual` opcional, `fecha_objetivo` opcional, `estado` opcional [`activa`|`completada`|`archivada`]). `GET /api/metas` y `GET /api/metas/{id}` incluyen el arreglo `aportes` de cada meta.

| Método | Endpoint             | Descripción         |
| ------ | --------------------- | ---------------------- |
| GET    | `/api/metas`            | Listar todas las metas   |
| POST   | `/api/metas`            | Crear una meta             |
| GET    | `/api/metas/{id}`       | Ver una meta (con aportes) |
| PUT    | `/api/metas/{id}`       | Actualizar una meta         |
| DELETE | `/api/metas/{id}`       | Eliminar una meta            |

Recurso anidado `aportes` (campos: `monto`, `fecha`, `nota` opcional). El registro y listado son anidados bajo la meta; ver, actualizar y eliminar son rutas planas (`shallow`):

| Método | Endpoint                        | Descripción                        |
| ------ | --------------------------------- | -------------------------------------- |
| GET    | `/api/metas/{meta_id}/aportes`      | Listar los aportes de una meta          |
| POST   | `/api/metas/{meta_id}/aportes`      | Crear un aporte para una meta            |
| GET    | `/api/aportes/{id}`                 | Ver un aporte                             |
| PUT    | `/api/aportes/{id}`                 | Actualizar un aporte                       |
| DELETE | `/api/aportes/{id}`                 | Eliminar un aporte                          |

## Probar con Postman

Importar la colección `postman/MiPresupuesto-API.postman_collection.json` (40 requests numerados, cada uno con asserts en la pestaña *Tests*). La colección tiene auth Bearer a nivel de colección usando la variable `token`:

0. Iniciar sesión (200, guarda el `token` recibido en la variable de colección `token`, usado automáticamente por el resto de requests)
1. Listar movimientos (200, respuesta es un arreglo)
2. Crear movimiento (201, guarda el `id` creado en la variable `movimiento_id` para encadenar el resto)
3. Ver ese movimiento (200)
4. Actualizarlo (200, verifica que los campos cambiaron)
5. Eliminarlo (204)
6. Volver a pedirlo (404, confirma que ya no existe)
7. Crear uno inválido (422, valida los errores de validación)
8. Reporte de movimientos por mes (200, respuesta es un arreglo)
9. Crear presupuesto de capacitación (201, guarda el `id` creado en la variable `presupuesto_id`)
10. Ver ese presupuesto (200)
11. Actualizarlo (200, verifica que los campos cambiaron)
12. Eliminarlo (204)
13. Volver a pedirlo (404, confirma que ya no existe)
14-18. Crear una cuenta, categoría, presupuesto de categoría, meta y aporte (201 cada uno, encadenando sus ids en variables de colección)
19-23. Listar cuentas, categorías, presupuestos de categoría, metas (con `aportes`) y los aportes de la meta (200, arreglos)
24-28. Ver por id cada uno de los cinco recursos anteriores (200)
29-33. Actualizar cada uno de los cinco recursos (200, verifica que el campo cambió)
34-38. Eliminar cada uno, en orden inverso de dependencia: aporte → meta → presupuesto de categoría → categoría → cuenta (204)
39. Cerrar sesión (204, revoca el token usado durante toda la corrida)

Con `php artisan serve` corriendo, se puede ejecutar toda la colección de una vez con el **Collection Runner** de Postman (o `newman run postman/MiPresupuesto-API.postman_collection.json`) y va a mostrar los 40 checks en verde. La variable de colección `base_url` apunta por defecto a `http://127.0.0.1:8000/api`.

## Tests automatizados (PHPUnit)

Además de Postman, cada recurso tiene tests de feature en `tests/Feature/` (`AuthApiTest`, `MovimientoApiTest`, `ReporteApiTest`, `PresupuestoCapacitacionApiTest`, `CuentaApiTest`, `CategoriaApiTest`, `PresupuestoCategoriaApiTest`, `MetaApiTest`, `AporteMetaApiTest`) — login/logout, autenticación requerida, listar, crear, validación de datos inválidos, ver, 404, actualizar, eliminar:

```bash
php artisan test
```
