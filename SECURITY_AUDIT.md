# Revisión de seguridad OWASP

Informe base: 2026-10-16
Alcance base: revisión estática del cliente Expo, API Laravel y migraciones/Edge Functions de Supabase, además de comprobaciones puntuales de AWS/Vercel y consultas de solo lectura a Supabase. Las actualizaciones posteriores están fechadas por separado. Este documento no es una certificación ni una prueba de penetración completa de producción.

## Escaneo preventivo antes de publicar cambios en GitHub (2026-10-23)

- `npm audit` completo y `npm audit --omit=dev`: cero vulnerabilidades después de unificar Zod transitivo con la dependencia directa `zod@4.6.7`. Expo SDK 57 siguió exportando correctamente las 50 rutas web.
- `composer audit --locked --no-interaction`: sin avisos de seguridad.
- El escaneo de patrones en los archivos candidatos no encontró claves privadas, claves AWS ni tokens de proveedores. Detectó una contraseña literal de prueba en `__tests__/verificacionCorreo.test.ts`; es un dato ficticio de test, no una credencial de cuenta.
- `git diff --check`: sin errores de formato. Se añadieron reglas de exclusión para `supabase/.temp/` y los artefactos de APK, firma y presentación, que no deben entrar en el historial de código.

Este escaneo cubre las dependencias y los archivos locales que se preparan para GitHub; no es una prueba de penetración de la infraestructura desplegada.

## Estado de la APK de Android (2026-10-23)

Se inspeccionó el artefacto local `artifacts/MiPresupuesto.apk` sin instalarlo ni ejecutarlo:

- Paquete: `com.mipresupuesto.app`; versión `1.0.1` (`versionCode` 2).
- SDK mínimo: 24; SDK objetivo: 36.
- El archivo mide 57,691,770 bytes, tiene fecha de modificación local 2026-10-17 y su firma JAR pasa `jarsigner -verify`. La firma usa un certificado autofirmado y no tiene sello de tiempo.
- SHA-256: `c36dd31af74a854774a4e57ed65a7568ecb227370bfa32505434ace167c4362f`.

El código fuente recibió cambios posteriores a la fecha del artefacto. Por ello, esta APK no se considera una compilación actualizada con todas las correcciones recientes. En esta revisión no había una sesión autenticada de EAS ni un dispositivo o emulador Android disponible; no se pudo crear un build nuevo ni comprobar instalación, inicio de sesión y flujos financieros en ejecución. El resultado confirma metadatos y firma del archivo, no su funcionamiento de extremo a extremo.

Para declarar funcional la versión actual en Android, hay que generar una APK nueva con el perfil `preview` de `eas.json`, instalarla en un dispositivo o emulador y recorrer autenticación, navegación, movimientos, metas y sincronización.

## Comprobación de despliegue (2026-10-15)

AWS CLI informó que `Mipresupuesto-api-env` está `Ready/Green` en la versión `v7-cuentas-prueba-1`. La app Vercel `mipresupuesto-rho.vercel.app` carga el proyecto esperado y compila `EXPO_PUBLIC_LARAVEL_API_URL` como `https://d1zwtjt6sp3l7r.cloudfront.net/api`. CloudFront exige HTTPS al visitante y el preflight CORS de `POST /api/login` devuelve `204` con los métodos/headers requeridos. La autenticación Supabase de las dos cuentas de prueba devolvió `200` y ambas sesiones se cerraron (`204`); las consultas RLS a cuentas, categorías, movimientos, presupuestos, metas y aportes devolvieron cero registros para cada una.

En Laravel Sanctum, la primera cuenta autenticó (`200`), obtuvo siete movimientos y dos periodos de reporte; no tiene cuentas ni metas Laravel. La segunda cuenta devolvió `422` con la contraseña de prueba usada. La respuesta de login oculta intencionalmente si la cuenta falta o la contraseña no coincide, así que no se hicieron intentos con otras contraseñas. El token de la primera cuenta se revocó (`204`). Esto muestra que el login Supabase de ambas funciona, pero no que ambas credenciales Laravel funcionen ni que los datos estén cargados en Supabase.

CloudFront conecta con el origen EB mediante `http-only`. La instancia EB es `SingleInstance`, usa SQLite en `/var/app/db/database.sqlite` en disco local y su versión desplegada sigue siendo anterior al cambio local de gestión segura de cuentas. Restringí el grupo de seguridad de la instancia para aceptar el puerto 80 solo desde la lista administrada de IP de origen de CloudFront; comprobé que el API detrás de CloudFront siga respondiendo y que el acceso directo al origen agote el tiempo. Esta regla está aplicada al grupo EB actual y debe codificarse para no perderse al reemplazar la instancia o el entorno. El salto CloudFront-origen sigue sin TLS; se necesita certificado para el origen y HTTPS de extremo a extremo. Los reemplazos de instancia también pueden perder la base local; se requiere una base administrada con respaldos para producción.

Verificación local tras los cambios: Jest 113 pruebas y TypeScript pasaron; Laravel 66 pruebas / 212 aserciones pasaron; `npm audit --omit=dev` y `composer audit` no reportaron vulnerabilidades. Estas verificaciones no sustituyen la corrección del login Sanctum de la segunda cuenta ni la carga intencional de datos en Supabase.

## Comprobación y despliegue AWS/Vercel (2026-10-16)

La inspección actualizó varios datos históricos de esta auditoría. Elastic Beanstalk está `Ready/Green` en `v16-enable-ssm-agent-20261016`. La versión v15 desplegó las dos correcciones de validación parcial en `MovimientoController` y `MetaController`; la v16 conserva ese paquete y añade un hook que habilita el agente SSM. El despliegue terminó sano. Por CloudFront, `GET /api/user` sin token devuelve `401` y el preflight de `POST /api/login` devuelve `204`. La IP y hostname directos de EB agotan el tiempo porque el grupo de seguridad permite el puerto 80 solo desde el prefijo AWS de CloudFront; el origen protegido es intencional y no se abrió a Internet.

La web se volvió a publicar en Vercel después de verificar que servía un bundle anterior al código local. El deployment de producción nuevo quedó `READY`; `https://mipresupuesto-rho.vercel.app/` devuelve `200` por HTTPS y sirve un bundle distinto del anterior. El paquete de despliegue excluye variables `.env*`, bases SQLite locales, dependencias de desarrollo del backend y artefactos temporales.

La Vercel de producción está configurada para usar el hostname de CloudFront. CloudFront redirige visitantes a HTTPS y reenvía todos los headers, cookies y query strings; la API no autenticada confirma que la distribución llega a Laravel. El cifrado de visitante a CloudFront está activo, pero la distribución usa el certificado por defecto `*.cloudfront.net`, que AWS limita a TLS 1.0 como protocolo mínimo; el tramo CloudFront–Elastic Beanstalk está configurado `http-only`. Para cerrar estos dos hallazgos se necesita un dominio propio con certificado ACM y cambiar el origen a HTTPS. La cuenta no tiene zonas Route 53 ni certificados ACM registrados; no había un dominio que pudiera usar para completar ese cambio.

Otros hallazgos de infraestructura confirmados: entorno EB de instancia única `t3.micro`; SQLite en `/var/app/db/database.sqlite`; volumen raíz GP3 de 8 GB. `APP_DEBUG=false`, `APP_ENV=production` y la instancia requiere IMDSv2. El volumen raíz se migró a uno cifrado usando un snapshot verificado; la base SQLite sigue en disco local, por lo que una pérdida o reemplazo de instancia aún puede interrumpir el servicio. Migrar a una base administrada requiere exportar y validar la información con un plan de migración.

Controles de auditoría y borde aplicados el 2026-10-16 mediante CloudFormation `mipresupuesto-production-controls`: CloudTrail multi-región registra eventos de administración con validación de integridad en un bucket privado, cifrado y con retención de 365 días. CloudTrail ya entregó 77 objetos, aproximadamente 106 KB. AWS WAF está asociado a CloudFront `EQQ9O85TG8Z2V`; el conjunto administrado Common Rule Set está en modo conteo para observar falsos positivos y el límite de más de 1.000 solicitudes por IP en cinco minutos sí bloquea. La asociación quedó desplegada y se repitieron las comprobaciones HTTP 401 y CORS 204. WAF tiene un costo base estimado de USD 7/mes más solicitudes; CloudTrail puede cobrar almacenamiento S3. No se enviaron ataques ni ráfagas de carga a producción. La definición queda en [infra/aws/production-controls.yaml](infra/aws/production-controls.yaml) y el procedimiento/costos en [infra/aws/README.md](infra/aws/README.md).

La cuenta AWS reporta plan `FREE` activo, USD 113.47 en créditos y vencimiento el 2027-02-27. Cost Explorer denegó acceso a este usuario, así que no se pudo confirmar el total real facturado ni el uso de créditos por todos los servicios. No se añadieron bases de datos ni servicios nuevos con cargos recurrentes.

### Seguimiento AWS (2026-10-17)

Después de adjuntar `AmazonSSMManagedInstanceCore`, reinicié la instancia EC2. Systems Manager ahora informa `Online` con agente `3.3.5226.0`; el entorno se mantuvo `Ready/Green`. Mediante SSM confirmé que el servicio está activo y que `PRAGMA quick_check` devuelve `ok` en `/var/app/db/database.sqlite` (4 usuarios, 18 tablas; solo se consultaron conteos, no datos personales). No se abrió SSH.

Se desplegó la pila CloudFormation `mipresupuesto-encrypted-ebs-backups`, definida en [infra/aws/encrypted-ebs-backups.yaml](infra/aws/encrypted-ebs-backups.yaml). La función toma una instantánea diaria crash-consistent, la copia cifrada con EBS, elimina la intermedia sin cifrar, conserva hasta siete copias cifradas y evita duplicar el respaldo del día. La invocación fue probada y se comprobó una copia cifrada; quedan tres puntos de recuperación cifrados después de borrar duplicados. Estimación conservadora: hasta USD 2.80/mes si cada una de las siete copias ocupa los 8 GB completos a USD 0.05/GB-mes; el uso incremental suele ser menor. El 2026-10-16 se restauró temporalmente el punto más reciente a un volumen cifrado, se montó en solo lectura y la base restaurada devolvió `PRAGMA integrity_check = ok` con 18 tablas. El volumen temporal se desmontó, separó y eliminó; no se afectó el servicio.

El volumen raíz actual `vol-08c7997b2eb6650a6` ahora está cifrado, conserva 8 GB `gp3` y está marcado para borrarse al terminar la instancia. El volumen anterior sin cifrar se eliminó después de validar el arranque, SSM, SQLite y API. También se habilitó el cifrado EBS predeterminado para futuros volúmenes de `us-east-1`, sin cargo adicional. El 2026-10-16 se creó en AWS Budgets el presupuesto mensual de costo `Mipresupuesto-monthly-30-usd`, con límite de USD 30 y alertas por correo a la cuenta del usuario al superar 50% (USD 15), 80% (USD 24), 100% (USD 30) del gasto real y al pronosticar superar el 100%. En la consulta de hoy el presupuesto reportaba USD 0 de gasto; no se toma como confirmación de la factura final porque Cost Explorer deniega acceso a esta identidad y los datos de facturación pueden actualizarse con retraso. AWS Budgets monitoriza y alerta, pero no impone un tope duro ni detiene recursos.

Seguimiento de controles AWS el 2026-10-16: confirmé que CloudFront conserva `TLSv1` mínimo para visitantes y usa `http-only` hacia Elastic Beanstalk. No hay alias ni dominio propio ni certificado ACM en la cuenta; este hallazgo depende de disponer de un dominio y aprovisionar el certificado. WAF sigue con `AWSManagedRulesCommonRuleSet` en `Count`; su consulta de solicitudes muestreadas de las últimas tres horas devolvió cero, insuficiente para evaluar falsos positivos y cambiarlo a bloqueo con seguridad. El límite de 1.000 solicitudes por IP continúa en `Block`. Tras probar la restauración, Elastic Beanstalk siguió `Ready/Green`, SSM quedó `Online`, Vercel respondió `200` y la API protegida sin autenticación respondió `401`.

### Integración de Capacitaciones

El módulo ofrece reporte mensual y operaciones API para cuentas, categorías, metas, presupuestos por categoría y presupuestos de capacitación. Antes requería una segunda sesión Laravel independiente de la sesión Supabase de la app. El código local ahora acepta ambas identidades: usuarios normales reutilizan su access token Supabase; clientes externos pueden seguir usando Sanctum o un token Supabase. El enlace local por correo exige que Supabase confirme la dirección, y se conserva el aislamiento por usuario.

Este cambio requería desplegar la migración Laravel `2026_10_15_000001_add_supabase_identity_to_users.php` junto con las variables de proyecto Supabase en Elastic Beanstalk. La versión v15 se publicó el 2026-10-16 y el hook de postdeploy que ejecuta `php artisan migrate --force` terminó correctamente. La v16 mantiene ese esquema; los datos financieros de las pantallas normales almacenados en Supabase no se copian automáticamente a la base Laravel.

## Hallazgos

### Corregido en el código — Exposición y modificación cruzada de datos financieros

La API protegía las rutas con Sanctum, pero los recursos no tenían `user_id`. Se añadió una migración y ámbitos automáticos por usuario en modelos y controladores; las categorías globales siguen legibles pero no se pueden editar ni borrar. Se añadieron pruebas de aislamiento para todos los recursos, accesos por ID, modificaciones/eliminaciones cruzadas y vínculos de metas. La versión de producción v15 ejecutó el hook `php artisan migrate --force` sin error; los registros heredados con `user_id = NULL` permanecen ocultos.

Los registros anteriores a esta migración quedan con `user_id = NULL` y se ocultan al consultar con sesión. No se asignaron automáticamente porque los presupuestos y datos antiguos no permiten demostrar su propietario. Para recuperar datos heredados hay que asignarlos con una política validada; no se deben hacer globales.

### Mitigado parcialmente — Credenciales de demostración conocidas

`DatosDemoSeeder` está bloqueado en `APP_ENV=production`. La revisión del despliegue EB encontró además que el hook creaba usuarios con una contraseña fija. El comando ahora no hace nada por defecto; con habilitación explícita exige secretos distintos de al menos 16 caracteres, actualiza esas contraseñas y revoca sus tokens. Las cuentas ya existentes en AWS no se rotan hasta desplegar esta versión con los secretos configurados.

### Corregido — Dependencias de npm vulnerables

Se actualizaron las dependencias compatibles y se agregaron parches locales versionados para `braces`, `node-forge` y `sprintf-js`, cuyos avisos no tenían una versión corregida publicada al momento de la auditoría. Los parches limitan anidación, endurecen la validación de `DigestInfo` RSA y validan precision/ancho/formato. `npm audit` y `npm audit --omit=dev` informan cero vulnerabilidades. Los parches y sus referencias están documentados en [vendor/security-patches/README.md](vendor/security-patches/README.md). Se añadieron regresiones, incluido el vector público de falsificación RSA. Referencias: [GHSA de node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [CVE-2026-85393 y PR de node-forge](https://github.com/digitalbazaar/forge/pull/1152), [GHSA de braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [GHSA de sprintf-js](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).

### Corregido — PII en registro de intentos de acceso

El log de login fallido ya no incluye correo ni IP. También se limitaron longitud de correo y contraseña para rechazar solicitudes desproporcionadas.

### Corregido en el código — Límites de gasto de Edge Functions manipulables y no atómicos

Los usuarios podían insertar directamente filas en tablas de cuotas y las funciones consultaban e insertaban por separado, permitiendo manipulación y carreras. El código incorporó `supabase/migrations/0005_limites_atomicos.sql` para limitar escrituras a RPC y hacer atómicos los cupos. Después se retiraron las Edge Functions de IA/búsqueda y la migración `0009_eliminar_funciones_ia_busqueda.sql` elimina esas tablas y funciones; por ello el control de cuotas de esas funciones ya no forma parte de la arquitectura activa. La inspección remota confirmó que las tablas de cuotas no están presentes.

### Corregido — Edición de categorías globales

El alcance de lectura de categorías globales también permitía modificarlas y borrarlas. Las mutaciones ahora rechazan categorías sin propietario.

### Corregido — Asociaciones entre filas de distintos usuarios en Supabase

La segunda pasada detectó que las políticas RLS comprobaban el propietario de la fila, pero no siempre el propietario de sus referencias. Las políticas de movimientos, presupuestos y metas ahora exigen cuentas y categorías del mismo usuario, permiten categorías globales y bloquean también referencias a movimientos ajenos. Se actualizó el esquema inicial y se añadió `supabase/migrations/0006_relaciones_mismo_usuario.sql` para bases existentes. La migración completa se ejecutó en PostgreSQL efímero con dos usuarios: se rechazaron cinco asociaciones cruzadas y se aceptaron relaciones propias/globales.

### Corregido — Lectura pública de avatares

El bucket `avatares` se configuraba público pese a contener fotos identificables. Ahora es privado y Storage permite leer archivos solo desde la carpeta del usuario autenticado. Se actualizó el esquema inicial y se añadió `supabase/migrations/0007_avatares_privados.sql` para proyectos existentes. PostgreSQL efímero confirmó que el bucket no es público, que una sesión anónima no lee archivos y que cada usuario solo ve/escribe en su propia carpeta.

### Mitigaciones web — Persistencia de tokens y transporte

Laravel y Supabase usan `sessionStorage` en web en lugar de almacenamiento persistente, y la API Laravel rechaza URLs HTTP en compilaciones de producción. Vercel entrega HSTS y cabeceras contra framing, MIME sniffing y filtración de referer. `sessionStorage` continúa accesible a JavaScript; una vulnerabilidad XSS aún podría robar la sesión activa. El cliente no implementa cookies HttpOnly, por lo que la mitigación completa requiere migrar autenticación web al backend.

### Corregido — Respuestas API y valores predeterminados de producción

La API Laravel envía `Cache-Control: no-store, private`, `Pragma: no-cache` y encabezados contra MIME sniffing, framing, filtración de referer y permisos innecesarios. El `.env.example` desactiva el modo debug y activa cifrado de sesión por defecto. Las variables de claves AWS de ejemplo advierten que en workloads AWS se use un rol IAM y no claves permanentes.

### Corregido — Inyección de fórmulas CSV y HTML en reportes

La comprobación de exportaciones encontró que descripciones de movimientos con prefijos de fórmula podían ejecutarse al abrir el CSV en una hoja de cálculo, y el PDF construía HTML con campos sin escapar. Los campos CSV peligrosos ahora se fuerzan a texto y todos los valores del HTML se escapan. Se agregaron pruebas de regresión para fórmulas, comillas, saltos de línea y etiquetas HTML maliciosas. La descarga web también conserva la URL del Blob hasta el siguiente turno del navegador para evitar carreras al iniciar la descarga.

## Controles revisados

- Las rutas de recursos requieren `auth:sanctum` y limitación de frecuencia.
- El login tiene limitación de 5 solicitudes por minuto; los tokens expiran a las 24 horas.
- Las migraciones Supabase habilitan RLS para tablas de usuario y las políticas de Storage separan carpetas por usuario. Las Edge Functions validan identidad antes de continuar y usan límites por usuario.
- El almacenamiento móvil usa SecureStore; la sesión web es temporal por pestaña y sigue expuesta si ocurre XSS.
- Revisar configuración de producción: `APP_DEBUG=false`, HTTPS, secretos solo en servidor y nunca una clave `service_role` en el bundle.

## Verificación ejecutada

- `npm test -- --runInBand`: 18 suites, 142 pruebas aprobadas, incluidas regresiones de exportación CSV/PDF y acceso de Capacitaciones.
- `php artisan test --compact`: 35 pruebas actuales aprobadas con 139 aserciones. Se retiraron siete suites de API que probaban la arquitectura anterior (SQLite y autenticación local Sanctum); sus flujos financieros ahora tienen cobertura contra un fake HTTP del PostgREST de Supabase en `SupabaseFinanceApiTest`, además de pruebas actuales de identidad, acceso y propiedad.
- `composer audit --no-interaction`: sin avisos de seguridad.
- `npm audit --omit=dev`: cero vulnerabilidades.
- `npm audit` completo: cero vulnerabilidades.
- `npm ci --ignore-scripts`: instalación limpia y reproducible; cero vulnerabilidades.
- `npm run doctor`: 18/18 comprobaciones aprobadas después de alinear los parches de Expo SDK 57.
- `npm run typecheck`: aprobado. Se excluyó `__tests__` del chequeo de la app; Jest ejecuta esas pruebas en su runtime.
- `npm run lint`: sigue fallando con 20 errores y 7 advertencias de reglas React Hooks/Compiler y variables sin uso; requiere correcciones de código antes de adoptar lint como gate de despliegue.
- En el proyecto Supabase remoto `mipresupuesto` se comprobó el estado real mediante SQL de solo lectura. Las políticas RLS actuales de movimientos, metas y presupuestos exigen relaciones del mismo propietario; el bucket `avatares` es privado, y ambos buckets tienen límites/tipos MIME; están presentes el trigger que recalcula metas, las cinco tablas financieras en `supabase_realtime` y las 38 categorías globales esperadas. El proyecto no tiene `supabase_migrations.schema_migrations`, por lo que no se puede atribuir ese estado a versiones ni correr `supabase db push` de forma segura: podría reejecutar cambios sobre datos existentes. No se ejecutaron escrituras en Supabase durante esta comprobación.
- Hay configuración de despliegue para Elastic Beanstalk y respaldos cifrados periódicos, pero falta infraestructura como código para la arquitectura completa. EB es `SingleInstance` y usa SQLite en disco local; los respaldos son snapshots crash-consistent y no se ha probado su restauración.
- El hostname directo de EB no es un endpoint público para clientes: su grupo de seguridad solo acepta HTTP desde CloudFront. La API sí respondió por HTTPS a través de CloudFront; el riesgo pendiente es TLS mínimo del certificado por defecto y HTTP entre CloudFront y el origen. Se necesita dominio propio y certificado ACM para elevar TLS y cifrar el origen.
- La cuenta no tiene zonas Route 53 ni certificados ACM que permitan completar el cambio de dominio/TLS desde esta sesión. Supabase fue inspeccionado de forma remota, pero no tiene historial de migraciones para usar con seguridad el CLI. El alcance detallado de políticas IAM y alertas operativas todavía requiere revisión.
- `.env` local y `laravel-api/.env` están ignorados por Git y no aparecen como archivos versionados.
- Se revisó el historial Git para patrones comunes de claves AWS, claves privadas PEM y claves de proveedores; no hubo coincidencias.
- Las siete migraciones Supabase se aplicaron en PGlite con esquemas sustitutos de `auth` y `storage`; finalizaron con 18 políticas. Las pruebas de dos usuarios bloquearon asociaciones cruzadas y confirmaron privacidad del bucket de avatares. Esto valida sintaxis y políticas del código, no la configuración del servicio remoto.

## Referencia de criterios

OWASP Top 10 (2021): A01 Control de acceso roto, A07 Fallas de identificación y autenticación, A06 Componentes vulnerables y desactualizados, A09 Fallas de registro y monitoreo. Para la app móvil se consideraron controles de almacenamiento de credenciales de OWASP MASVS. Esta revisión no es una certificación ni una prueba de penetración de producción.
