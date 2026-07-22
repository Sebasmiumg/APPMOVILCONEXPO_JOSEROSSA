// Edge Function: asistente-ia
//
// Nivel 2 del asistente financiero (ver AGENTS.md §15). Interpreta preguntas en
// lenguaje natural que el motor local (Nivel 1, src/servicios/asistente) no supo
// resolver. Solo recibe un RESUMEN agregado calculado en el cliente — nunca la
// lista completa de movimientos — y jamás expone la clave del proveedor de IA.
//
// Requiere, como secretos del proyecto de Supabase (nunca en el cliente):
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Despliegue:
//   supabase functions deploy asistente-ia
//
// Este archivo se escribió siguiendo los patrones oficiales de Supabase Edge
// Functions (Deno) pero no pudo desplegarse ni probarse en este entorno por no
// contar con un proyecto de Supabase real ni credenciales — ver limitación
// documentada en la Fase 5.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const LIMITE_SOLICITUDES_POR_HORA = 15;
const MODELO_IA = 'claude-sonnet-5';

interface ResumenFinanciero {
  periodo: string;
  ingresos: number;
  gastos: number;
  ahorroNeto: number;
  tasaAhorro: number;
  moneda: string;
  categoriaMayorGasto?: string;
}

interface CuerpoSolicitud {
  pregunta: string;
  resumen: ResumenFinanciero;
  idioma: string;
}

function respuestaJSON(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return respuestaJSON({ error: 'Método no permitido' }, 405);
  }

  const urlSupabase = Deno.env.get('SUPABASE_URL');
  const claveAnonima = Deno.env.get('SUPABASE_ANON_KEY');
  const claveIA = Deno.env.get('ANTHROPIC_API_KEY');
  if (!urlSupabase || !claveAnonima || !claveIA) {
    return respuestaJSON({ error: 'La función no está configurada correctamente en el servidor.' }, 500);
  }

  // El cliente se autentica con el JWT del usuario que llega en el header
  // Authorization; así toda operación respeta las políticas de RLS y sabemos
  // exactamente quién está preguntando (nunca se confía en un id enviado en el body).
  const encabezadoAuth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(urlSupabase, claveAnonima, {
    global: { headers: { Authorization: encabezadoAuth } },
  });

  const {
    data: { user },
    error: errorAuth,
  } = await supabase.auth.getUser();
  if (errorAuth || !user) {
    return respuestaJSON({ error: 'No autenticado.' }, 401);
  }

  const permitido = await verificarLimiteSolicitudes(supabase, user.id);
  if (!permitido) {
    return respuestaJSON({ error: 'Has alcanzado el límite de preguntas por hora. Intenta más tarde.' }, 429);
  }

  let cuerpo: CuerpoSolicitud;
  try {
    cuerpo = await req.json();
  } catch {
    return respuestaJSON({ error: 'Solicitud inválida.' }, 400);
  }

  if (!cuerpo.pregunta || typeof cuerpo.pregunta !== 'string' || cuerpo.pregunta.length > 500) {
    return respuestaJSON({ error: 'La pregunta es requerida y debe tener menos de 500 caracteres.' }, 400);
  }
  if (!cuerpo.resumen) {
    return respuestaJSON({ error: 'Falta el resumen financiero.' }, 400);
  }

  try {
    const respuesta = await consultarIA(cuerpo, claveIA);
    return respuestaJSON({ respuesta });
  } catch (error) {
    // No se registra el contenido financiero del usuario, solo que la llamada falló.
    console.error('Fallo al consultar el proveedor de IA', error instanceof Error ? error.message : 'error desconocido');
    return respuestaJSON({ error: 'No se pudo generar una respuesta en este momento.' }, 502);
  }
});

async function verificarLimiteSolicitudes(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string
): Promise<boolean> {
  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('limites_solicitudes_ia')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .gte('creado_en', haceUnaHora);

  if ((count ?? 0) >= LIMITE_SOLICITUDES_POR_HORA) {
    return false;
  }

  await supabase.from('limites_solicitudes_ia').insert({ usuario_id: usuarioId });
  return true;
}

async function consultarIA(cuerpo: CuerpoSolicitud, claveIA: string): Promise<string> {
  const promptSistema = `Eres el asistente financiero educativo de la app MiPresupuesto. Responde en el idioma "${cuerpo.idioma}".
Solo puedes usar los datos del siguiente resumen financiero del usuario — no inventes cifras que no estén aquí:
${JSON.stringify(cuerpo.resumen)}
Responde en 1-3 frases, en tono cercano y sin juicios. Si la pregunta no puede responderse con este resumen, dilo con honestidad y sugiere revisar la app.`;

  const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claveIA,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODELO_IA,
      max_tokens: 300,
      system: promptSistema,
      messages: [{ role: 'user', content: cuerpo.pregunta }],
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`El proveedor de IA respondió con estado ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  const texto = datos?.content?.[0]?.text;
  if (typeof texto !== 'string') {
    throw new Error('Respuesta con formato inesperado del proveedor de IA');
  }
  return texto;
}
