# MiPresupuesto

App de finanzas personales multiplataforma (iOS, Android, Web) construida con Expo SDK 57, React Native 0.86 y TypeScript en modo estricto. Funciona por completo en local (SQLite) sin necesidad de ninguna cuenta ni servicio externo, y de forma opcional puede sincronizarse con un backend propio en Supabase.

## Características

- **Cuentas, movimientos, categorías y presupuestos** con almacenamiento local en `expo-sqlite`, incluyendo foto de comprobante por movimiento (`expo-image-picker`) y movimientos recurrentes que se auto-generan mes a mes.
- **Alertas de presupuesto y recordatorios** vía notificaciones locales (`expo-notifications`) cuando un gasto cruza el umbral de alerta o el límite de un presupuesto.
- **Bloqueo biométrico opcional** (Face ID/huella/código del dispositivo, `expo-local-authentication`) para proteger el acceso a la app.
- **Dashboard, análisis y reportes** con cálculos financieros reales (saldo, gasto por categoría, comparación mensual, proyecciones, salud financiera) y exportación a CSV/PDF.
- **Metas de ahorro** con progreso, aportes y sugerencia de ahorro semanal/mensual.
- **Asistente financiero conversacional** que responde preguntas en lenguaje natural sobre tus propios datos, de forma 100% local (sin enviar información a ningún servidor), con una escalada opcional a IA para preguntas que no reconoce.
- **Reinversión educativa**: alternativas reales (cooperativas, CertiBonos, INTECAP, crédito productivo, etc.) con fuentes oficiales citadas y verificables.
- **Autenticación y sincronización opcional** vía Supabase (Auth + Postgres con Row Level Security + Storage), con degradación elegante: si no hay proyecto de Supabase configurado, la app sigue funcionando igual en modo local.
- **Pantalla de Privacidad** que explica qué se guarda localmente, qué se sincroniza (si aplica) y da acceso directo a exportar o eliminar tus datos.
- **Internacionalización completa**: español, inglés, chino, hindi y árabe (con soporte RTL), usando `i18next` y el API `Intl` del dispositivo para fechas, monedas y nombres de mes.
- **Capacitaciones**, integrada con la API propia en Laravel ([`laravel-api/`](laravel-api/README.md)): login con token, reporte de caja mensual y CRUD completo de cuentas, categorías, metas, presupuestos por categoría y presupuestos de capacitación, todo consumido en vivo por la app.
- **Tema claro/oscuro**, diseño responsivo (móvil/tablet/web) y componentes con soporte de accesibilidad (roles, labels y agrupación para lectores de pantalla).

> Nota: `expo-notifications` y `expo-local-authentication` no funcionan en web (limitación de las librerías, no de la app) — MiPresupuesto lo detecta y lo indica en pantalla en vez de fallar. Pruébalos en un build nativo (iOS/Android) o Expo Go.

## Empezar

1. Usa Node.js 22 LTS (el archivo `.nvmrc` permite seleccionarlo con `nvm use`) e instala dependencias:

   ```bash
   nvm use
   npm install
   ```

2. (Opcional) Configurar Supabase: copia `.env.example` a `.env` y completa las variables con los datos de tu proyecto (ver [Sincronización con Supabase](#sincronización-con-supabase-opcional) más abajo). Si no configuras nada, la app funciona igual en modo local/demostración.

3. Iniciar el servidor de desarrollo:

   ```bash
   npx expo start
   ```

   Desde ahí puedes abrir la app en Expo Go, un simulador de iOS/Android, o en el navegador (`npx expo start --web` / tecla `w`).

### API Laravel propia (Capacitaciones)

La pestaña **Capacitaciones** consume la API construida en [`laravel-api/`](laravel-api/README.md) (movimientos, reporte mensual, cuentas, categorías, metas, presupuestos por categoría y de capacitación). Levanta ese backend por separado y apunta la app a su URL en `.env`:

```bash
EXPO_PUBLIC_LARAVEL_API_URL=http://127.0.0.1:8000/api
```

En un simulador/emulador `127.0.0.1` funciona; en un dispositivo físico con Expo Go hay que usar la IP LAN de la máquina donde corre `php artisan serve` (por ejemplo `http://192.168.1.10:8000/api`).

Todos los recursos requieren sesión: la pestaña pide email/contraseña (ver credenciales de prueba en [`laravel-api/README.md`](laravel-api/README.md#autenticación)), guarda el token de forma segura en el dispositivo y lo envía en cada petición. Si el token expira o la API responde 401, la app vuelve automáticamente a la pantalla de login.

## Scripts disponibles

| Script                | Descripción                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm start`             | Inicia el servidor de desarrollo de Expo                  |
| `npm run web`           | Inicia la app en el navegador                             |
| `npm run android`       | Inicia la app en un emulador/dispositivo Android           |
| `npm run ios`           | Inicia la app en un simulador/dispositivo iOS               |
| `npm run typecheck`     | Verifica tipos con `tsc --noEmit`                          |
| `npm test`              | Ejecuta la suite de pruebas unitarias (Jest)                |
| `npm run doctor`        | Corre `expo-doctor` para validar la configuración del proyecto |
| `npm run lint`          | Corre el linter de Expo                                    |

## Arquitectura

- **`app/`** — Rutas de la aplicación (Expo Router, enrutamiento por archivos): autenticación, configuración inicial, pantallas principales (inicio, movimientos, análisis, metas, asistente, reinversión, perfil) y pantallas modales (nueva cuenta, nuevo movimiento, nueva meta, etc.).
- **`src/base-datos/`** — Esquema y repositorios de SQLite (fuente de verdad local).
- **`src/servicios/supabase/`** — Cliente y helpers de Supabase; `supabaseEstaConfigurado()` controla la degradación elegante cuando no hay backend configurado.
- **`src/servicios/sincronizacion/`** — Cola de sincronización local → Supabase.
- **`src/servicios/asistente/`** — Motor local de detección de intención y generación de respuestas del asistente financiero, más el cliente opcional de IA (Edge Function).
- **`src/servicios/reinversion/`** — Catálogo de alternativas de reinversión con fuentes verificadas.
- **`src/utilidades/`** — Funciones puras de cálculo financiero (usadas por dashboard, análisis, reportes y el asistente), sin dependencias de React ni de i18n — fáciles de testear de forma aislada.
- **`src/componentes/`** — Componentes de UI reutilizables, organizados por dominio.
- **`src/idiomas/`** — Diccionarios de traducción (es, en, zh, hi, ar).
- **`src/contextos/`** — Contextos de React para tema, idioma, autenticación y datos financieros.
- **`supabase/`** — Migraciones SQL y Edge Functions (Deno) del backend opcional.

## Sincronización con Supabase (opcional)

MiPresupuesto es **local-first**: todos los datos viven en SQLite en el dispositivo y la app es completamente funcional sin backend. Si quieres habilitar cuenta en la nube, sincronización entre dispositivos, respaldo de comprobantes y el asistente con IA:

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Aplica las migraciones en `supabase/migrations/` (en orden) a tu proyecto.
3. Completa `.env` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ambas son públicas a propósito; nunca coloques ahí una clave `service_role`).
4. Despliega las Edge Functions en `supabase/functions/` con `supabase functions deploy <nombre>` y configura sus secretos (`ANTHROPIC_API_KEY`, `BRAVE_SEARCH_API_KEY`, etc.) con `supabase secrets set`.

**Limitación conocida**: las Edge Functions (`asistente-ia`, `busqueda-recomendaciones`) están escritas siguiendo los patrones oficiales de Supabase/Deno, pero no han sido desplegadas ni probadas en vivo en este entorno de desarrollo por no contar con un proyecto de Supabase real ni credenciales de terceros (Anthropic, Brave Search). Revísalas antes de desplegar a producción.

## Pruebas

```bash
npm test
```

Las pruebas cubren la lógica de negocio pura: cálculos financieros, análisis y planificación, formato de moneda, clasificación de correos, validaciones de autenticación, y el motor del asistente (detección de intención, detección de mes en texto libre y generación de respuestas).

## Accesibilidad

- Todos los controles interactivos (botones, campos, chips, selectores) exponen `accessibilityRole` y `accessibilityLabel`.
- Las tarjetas informativas (saldo, métricas, recomendaciones, alternativas de reinversión) se agrupan como un solo elemento accesible para que los lectores de pantalla las anuncien de forma coherente.
- Las gráficas (dona de categorías, barras de ingresos/gastos) siempre van acompañadas de una leyenda textual equivalente; el dibujo SVG se oculta de la jerarquía de accesibilidad para evitar redundancia.
- El árabe activa automáticamente el layout RTL del sistema (`I18nManager`).

## Estado del proyecto

Desarrollado en fases incrementales, cada una verificada con `typecheck`, `jest` y `expo-doctor` antes de continuar: base de la app y navegación → cuentas/movimientos/categorías/dashboard → presupuestos/metas/análisis/reportes → autenticación y sincronización con Supabase → asistente financiero y módulo de reinversión → pruebas, accesibilidad, optimización y documentación.
