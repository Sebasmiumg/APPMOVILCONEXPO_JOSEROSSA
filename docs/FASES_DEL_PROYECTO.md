# Fases del proyecto MiPresupuesto

## Propósito

MiPresupuesto ayuda a registrar y consultar finanzas personales desde web y móvil. El proyecto integra almacenamiento local, sincronización en nube, una API propia para funciones de capacitación y controles de acceso por usuario.

## Nota sobre la secuencia

Las fases siguientes describen el orden funcional en que se estructuró el producto, reconstruido a partir del código y de las decisiones del proyecto. No asignan fechas históricas que no estén verificadas. Los 80 commits de la rama de integración se crearon en una sesión posterior para organizar cambios ya realizados; sus fechas no representan la fecha original de cada fase.

## Fases de desarrollo

### 1. Base móvil y web

Se establecieron Expo, React Native, TypeScript y Expo Router. Se definieron navegación, estilos, traducciones y componentes compartidos para las interfaces móvil y web.

### 2. Registro financiero

Se incorporaron el esquema SQLite y los repositorios para cuentas, categorías y movimientos. La aplicación permite consultar el saldo y registrar ingresos, gastos y transferencias desde sus formularios.

### 3. Planificación y reportes

Se añadieron presupuestos, metas de ahorro y aportes, análisis financieros y exportación de reportes. Se ajustaron formularios y presentación de fechas para el comportamiento de los navegadores y dispositivos.

### 4. Sesión y privacidad de datos

Se integró la autenticación de Supabase y el almacenamiento seguro de la sesión móvil. Se reforzó el estado de carga y cierre de sesión para que los datos de una cuenta no se sigan mostrando al cerrar sesión o cambiar de usuario. El backend valida también la identidad y la propiedad de los recursos.

### 5. Persistencia y sincronización

Se conectaron la base local, la cola de sincronización y los cambios remotos. Se incorporaron controles para volver a cargar datos al reabrir la aplicación y para mantener consistencia entre los datos locales y la nube.

### 6. API y área de Capacitaciones

Se desarrolló la API Laravel para consultar los recursos financieros y servir Capacitaciones. La autenticación entrega un token con expiración; las rutas comprueban identidad y autorización. El acceso a Capacitaciones está limitado a las cuentas autorizadas en el backend, tanto desde la interfaz como desde clientes externos.

### 7. Frameworks y experiencia multiplataforma

Se incorporó el área de Frameworks y se adaptaron navegación, selectores, iconos y manifest para la experiencia web instalable. El mismo código base incluye configuración nativa de Android e iOS.

### 8. Despliegue y seguridad

Se documentaron y configuraron componentes de despliegue con Vercel, CloudFront y Elastic Beanstalk, además de controles AWS como WAF, registros CloudTrail y respaldos cifrados. El alcance desplegado y los puntos de infraestructura pendientes están detallados en [`SECURITY_AUDIT.md`](../SECURITY_AUDIT.md) y [`infra/aws/README.md`](../infra/aws/README.md).

### 9. Comprobación y organización del código

Se revisaron dependencias npm y Composer, configuración web y controles de seguridad. El 23 de octubre de 2026 ambos escaneos de dependencias reportaron cero avisos. Los cambios se organizaron en ocho ramas funcionales de diez commits cada una, con una rama de integración de 80 commits sobre el punto de respaldo.

## Estado de los entregables

| Entregable | Estado documentado | Evidencia y trabajo pendiente |
| --- | --- | --- |
| Aplicación móvil Android | Código y perfil APK configurados; hay un artefacto local | La APK existente es `1.0.1` (`versionCode` 2) y fue modificada el 17 de octubre. No se reconstruyó con los cambios posteriores ni se instaló y recorrió en un dispositivo durante esta revisión. |
| Aplicación iOS / `.ipa` | Pendiente como instalador nativo | Un APK no se instala en iOS. La alternativa disponible es la web PWA; generar un `.ipa` requiere build firmado y cuenta/entorno Apple. |
| API y token con expiración | Implementado en el backend Laravel | La expiración se devuelve junto con la sesión. La configuración y rutas están descritas en [`laravel-api/README.md`](../laravel-api/README.md). |
| Interfaz web, nube, dominio y TLS | Desplegados según las comprobaciones registradas | El sitio usa Vercel y el API AWS está detrás de CloudFront. La auditoría documenta los límites de TLS entre CloudFront y el origen AWS; no se debe asumir cifrado de extremo a extremo sin resolverlos. |
| Documentación | En actualización | README, auditoría de seguridad y este historial de fases están en el repositorio. |
| Presentación | Hay un archivo local | `artifacts/MiPresupuesto-presentacion.pptx` existe en este espacio de trabajo, pero está excluido de Git. Su contenido y render no se revisaron en esta tarea. |
| Demo | Prueba manual reportada por el usuario | La última revisión documental no repitió el recorrido completo ni verificó la APK actualizada. |
| GitHub | Publicado | Las ocho ramas funcionales y `integracion/entrega-80` están publicadas. La rama de integración todavía no está fusionada en `main`. |

## Situación de la APK Android

El archivo [`artifacts/MiPresupuesto.apk`](../artifacts/MiPresupuesto.apk) existe en el espacio de trabajo local y pasó una verificación estática de firma JAR. Sus metadatos indican Android mínimo 24, objetivo 36 y paquete `com.mipresupuesto.app`. Git ignora `artifacts/`, por lo que el APK no está incluido en las ramas publicadas.

El código fuente se modificó después de la fecha de ese artefacto. Por tanto, no se puede afirmar que la APK actual contenga los arreglos recientes ni que todos sus flujos funcionen en Android. Para cerrar este entregable hace falta iniciar sesión en EAS, generar una nueva APK con el perfil `preview` e instalarla en un dispositivo o emulador para probar inicio de sesión, aislamiento de datos, movimientos, metas, navegación y sincronización.
