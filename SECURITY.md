# Seguridad

## Reportar una vulnerabilidad

No publiques credenciales ni detalles explotables en un issue público. Usa la función **Report a vulnerability** de GitHub Security Advisories en el repositorio.

## Secretos y configuración

- Nunca confirmes `.env`, tokens reales, claves `service_role` ni secretos de proveedores.
- Las variables `EXPO_PUBLIC_*` quedan incluidas en el bundle y no deben contener secretos de servidor.
- Las claves privadas de IA, búsqueda o Supabase deben vivir en secretos de Supabase Edge Functions.
- Antes de publicar, ejecuta `git check-ignore .env` y revisa los archivos preparados con `git diff --cached`.
- En AWS, entrega credenciales al workload mediante un IAM role temporal con permisos mínimos. No guardes claves de IAM en variables del bundle, imágenes Docker ni archivos `.env` desplegados.
- Guarda secretos de aplicación en Secrets Manager o el almacén de secretos del servicio AWS elegido; entrega solo los secretos necesarios a cada servicio.
- Configura HTTPS y HSTS en CloudFront o el balanceador una vez conocido el dominio. El API añade `no-store` y encabezados defensivos para respuestas.
- Mantén la base de datos privada, limita los Security Groups a los orígenes necesarios y activa cifrado y copias de seguridad con protección contra borrado.
- Habilita CloudTrail y alertas de cambios de IAM, políticas de bucket, grupos de seguridad y acceso público.

## Dependencias y compilación

- Usa Node.js 22 LTS (`nvm use`) y conserva `package-lock.json`.
- Ejecuta `npm ci`, `npm audit --omit=dev`, `npm run doctor`, `npm run typecheck`, `npm test -- --runInBand` y `npm run lint` antes de una entrega.
- No uses `npm audit fix --force`: puede reemplazar Expo/React Native por versiones incompatibles.
- Solo agrega imágenes de confianza a `assets/`. Metro usa `image-size` durante el empaquetado y sus analizadores de ICNS/JXL/HEIF tienen avisos de denegación de servicio sin versión corregida. La app no acepta esos formatos como activos proporcionados por usuarios.

## Datos de usuario

- Mantén Row Level Security habilitado en todas las tablas sincronizadas de Supabase.
- No registres tokens, sesiones, datos financieros ni respuestas completas de proveedores externos.
- Valida y limita las solicitudes en Edge Functions, y devuelve errores genéricos al cliente.
