# MiPresupuesto API (Laravel)

API REST construida con Laravel que expone el dominio completo de la app [MiPresupuesto](../README.md): **Cuentas**, **Categorías**, **Movimientos** (transacciones de ingresos/gastos), **Metas** de ahorro con sus **Aportes**, **Presupuestos por categoría**, **Presupuestos de capacitación** y un **reporte mensual de caja**. Todas las rutas se definen exclusivamente en `routes/api.php` (no se usa `web.php`).

> La sección **Capacitaciones** de la app móvil consume esta API en vivo (login incluido); el resto de la app sigue usando SQLite local / Supabase.

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

- **5 usuarios** con nombre/correo realistas (tabla `users`, aún no ligada a los recursos de dominio — ver nota arriba).
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

Todos los recursos de dominio requieren un token Bearer emitido por Sanctum. El flujo es:

1. `POST /api/login` con `email` y `password` → devuelve `{ "usuario": {...}, "token": "..." }`.
2. Enviar `Authorization: Bearer {token}` en cada petición a un recurso protegido.
3. `POST /api/logout` (autenticado) revoca el token actual.

| Método | Endpoint       | Auth requerida | Descripción                              |
| ------ | -------------- | --------------- | ------------------------------------------ |
| POST   | `/api/login`   | No              | Inicia sesión, devuelve el token            |
| POST   | `/api/logout`  | Sí              | Revoca el token actual                       |
| GET    | `/api/user`    | Sí              | Devuelve el usuario autenticado                |

Credenciales de prueba (sembradas por `DatosDemoSeeder`): cualquiera de los 5 correos listados abajo, contraseña `password` para todos (por ejemplo `ana.lopez@example.com` / `password`).

Notas de seguridad aplicadas:

- Los tokens expiran a las 24 horas (`config/sanctum.php` → `expiration => 1440`).
- `POST /api/login` está limitado a 5 intentos por minuto por IP (`throttle:5,1`) para mitigar fuerza bruta.
- El resto de rutas autenticadas está limitado a 60 peticiones por minuto (`throttle:60,1`).
- Los intentos de login fallidos se registran en el log de la aplicación (`storage/logs/laravel.log`) sin incluir la contraseña.
- `APP_DEBUG` debe estar en `false` fuera de desarrollo local para no exponer stack traces (ver `.env`).

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
