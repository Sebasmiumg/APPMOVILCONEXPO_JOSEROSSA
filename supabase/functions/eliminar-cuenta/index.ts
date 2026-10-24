// Edge Function: eliminar-cuenta
//
// Completa el borrado de cuenta que el cliente no puede hacer por sí solo:
// supabase.auth.admin.deleteUser() requiere la service_role key, que nunca
// puede vivir en la app (ver AGENTS.md §5 y §23). Todas las tablas propias
// del usuario (perfiles, movimientos, metas, cuentas, categorías,
// presupuestos, recomendaciones, conversaciones, límites de IA/búsqueda)
// tienen "references auth.users(id) on delete cascade", así que borrar el
// usuario de Auth basta para borrar también todos sus datos.
//
// Requiere, como secreto del proyecto de Supabase (nunca en el cliente):
//   la service role key ya está disponible como SUPABASE_SERVICE_ROLE_KEY
//   en el entorno de toda Edge Function, no hace falta configurarla aparte.
//
// Despliegue:
//   supabase functions deploy eliminar-cuenta

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respuestaJSON(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return respuestaJSON({ error: 'Método no permitido' }, 405);
  }

  const urlSupabase = Deno.env.get('SUPABASE_URL');
  const claveAnonima = Deno.env.get('SUPABASE_ANON_KEY');
  const claveServicio = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!urlSupabase || !claveAnonima || !claveServicio) {
    return respuestaJSON({ error: 'La función no está configurada correctamente en el servidor.' }, 500);
  }

  // Igual que en asistente-ia: el usuario a borrar es siempre el dueño del
  // JWT recibido, nunca un id que mande el cliente en el body.
  const encabezadoAuth = req.headers.get('Authorization') ?? '';
  const clienteUsuario = createClient(urlSupabase, claveAnonima, {
    global: { headers: { Authorization: encabezadoAuth } },
  });
  const {
    data: { user },
    error: errorAuth,
  } = await clienteUsuario.auth.getUser();
  if (errorAuth || !user) {
    return respuestaJSON({ error: 'No autenticado.' }, 401);
  }

  const clienteAdmin = createClient(urlSupabase, claveServicio);
  const { error: errorBorrado } = await clienteAdmin.auth.admin.deleteUser(user.id);
  if (errorBorrado) {
    console.error('Fallo al eliminar la cuenta', errorBorrado.message);
    return respuestaJSON({ error: 'No se pudo eliminar la cuenta en este momento.' }, 502);
  }

  return respuestaJSON({ eliminado: true });
});
