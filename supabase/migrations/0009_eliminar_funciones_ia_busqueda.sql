-- Se decidió no pagar por las claves de API externas (Anthropic, Brave Search)
-- que requerían el Asistente IA (Nivel 2) y la Búsqueda de recomendaciones.
-- Ninguna de las dos Edge Functions llegó a desplegarse nunca, así que esto
-- solo limpia la infraestructura de límites de uso que quedó sin dueño.

drop function if exists public.limpiar_limites_ia_antiguos();
drop function if exists public.limpiar_limites_busqueda_antiguos();
drop function if exists public.registrar_solicitud_ia();
drop function if exists public.registrar_solicitud_busqueda();

drop table if exists public.limites_solicitudes_ia;
drop table if exists public.limites_solicitudes_busqueda;
