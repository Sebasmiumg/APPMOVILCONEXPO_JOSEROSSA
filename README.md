# MiPresupuesto

MiPresupuesto es una aplicación multiplataforma para registrar y consultar finanzas personales. El cliente está construido con Expo, React Native y TypeScript; usa SQLite para el almacenamiento local y se integra con Supabase y una API Laravel para autenticación, sincronización y funciones de capacitación.

## Capacidades principales

- Registro de cuentas, categorías y movimientos de ingreso y gasto.
- Panel financiero, análisis, presupuestos y objetivos de ahorro.
- Sincronización de datos de usuario con Supabase cuando el entorno está configurado.
- Sección **Capacitaciones** conectada a la API Laravel. El servidor valida la sesión y controla el acceso a cada recurso.
- Sección **Frameworks** para consultar los recursos educativos habilitados.
- Exportación de reportes y preferencias de idioma y tema.
- Interfaz web instalable como PWA y cliente móvil para Android e iOS.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Cliente móvil y web | Expo SDK 57, React Native 0.86, Expo Router y TypeScript |
| Almacenamiento local | SQLite mediante `expo-sqlite` |
| Identidad y datos en nube | Supabase Auth, PostgreSQL, RLS y Storage |
| API de capacitación | Laravel, con validación de identidad y autorización por recurso |
| Web | Exportación estática de Expo y despliegue en Vercel |

## Requisitos de desarrollo

- Node.js compatible con el rango definido en [`package.json`](package.json).
- npm y PHP/Composer para trabajar también en la API Laravel.
- Una cuenta y proyecto Supabase para probar autenticación y sincronización remotas.

Instala las dependencias del cliente y crea una configuración local a partir del ejemplo:

```bash
npm ci
cp .env.example .env
```

Completa solo las variables públicas necesarias en `.env`. Las variables `EXPO_PUBLIC_*` se incluyen en el código del cliente; no pongas claves privadas, contraseñas de servidor ni la clave Supabase `service_role` allí.

Inicia la aplicación:

```bash
npx expo start
```

Para abrir la versión web:

```bash
npm run web
```

Los comandos disponibles para revisión local son `npm run typecheck`, `npm test`, `npm run lint` y `npm run doctor`.

## API Laravel

La API está en [`laravel-api/`](laravel-api/README.md). Sus endpoints de capacitación y datos financieros reciben tokens de acceso con expiración y aplican validación de identidad y propiedad del usuario. La documentación del backend incluye configuración, autenticación, recursos y ejemplos de solicitudes.

Para desarrollo local, copia `laravel-api/.env.example` a `laravel-api/.env`, configura las variables requeridas y sigue la guía del backend. No reutilices contraseñas reales en datos de demostración ni publiques archivos `.env`.

## Estado de Android e iOS

### Android

El proyecto tiene configurado un perfil EAS de distribución interna que produce un archivo APK. Hay un APK local en `artifacts/MiPresupuesto.apk`, con identificador `com.mipresupuesto.app`, versión `1.0.1` y código de versión `2`. El archivo observado fue modificado el 17 de octubre de 2026 y su firma JAR pasó la verificación estática.

**Este APK no se ha reconstruido con los cambios de código posteriores al 17 de octubre.** En esta revisión no fue posible instalarlo ni ejecutar la versión actual en un dispositivo o emulador Android; por eso no se certifica que incluya ni que funcione con todas las correcciones más recientes. Antes de entregar una APK actualizada, genera un build nuevo y valida instalación, inicio de sesión, navegación y operaciones financieras en Android.

Para generar una APK de prueba con EAS, inicia sesión con una cuenta EAS autorizada y ejecuta:

```bash
npx eas-cli build --platform android --profile preview
```

El perfil `preview` está definido en [`eas.json`](eas.json) con `buildType: apk`. El archivo de `artifacts/` se excluye de Git; la APK no forma parte de los commits de código.

### iOS

Un archivo APK no se instala en iOS. El proyecto no contiene un `.ipa` de distribución. En iPhone se puede usar la versión web instalable (PWA) desde Safari; para crear e instalar un `.ipa` se necesita un build iOS firmado y el entorno/cuenta de Apple correspondiente.

## Seguridad y verificación

La revisión de seguridad está documentada en [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md), y el proceso de reporte de vulnerabilidades en [`SECURITY.md`](SECURITY.md). El escaneo de dependencias del 23 de octubre de 2026 reportó cero avisos en npm y Composer. Estos resultados no equivalen a una certificación ni a una prueba de penetración del entorno desplegado.

La secuencia de construcción, las decisiones principales y el estado de los entregables se describen en [`docs/FASES_DEL_PROYECTO.md`](docs/FASES_DEL_PROYECTO.md).

## Estructura del repositorio

- `app/`: pantallas y rutas Expo Router.
- `src/base-datos/`: esquema SQLite y repositorios locales.
- `src/contextos/`: estado de sesión, finanzas y planificación.
- `src/servicios/`: clientes Supabase y Laravel, sincronización y reportes.
- `laravel-api/`: backend Laravel y sus pruebas.
- `supabase/migrations/`: cambios SQL para el esquema remoto.
- `infra/aws/`: plantillas y documentación de controles AWS.

## Contribuciones y ramas

Las ramas de funcionalidades y la rama `integracion/entrega-80` organizan el trabajo documentado en GitHub. La rama de integración reúne 80 commits posteriores al punto de respaldo local; todavía debe revisarse y fusionarse de acuerdo con el flujo del repositorio antes de considerar esos cambios parte de `main`.
