// Edge Function: busqueda-recomendaciones
//
// Búsqueda web transparente para el módulo de Reinversión (ver AGENTS.md §19).
// Complementa el catálogo local cacheado en
// src/servicios/reinversion/alternativasSemilla.ts con una búsqueda en vivo,
// priorizando reguladores, bancos centrales y entidades supervisadas.
//
// Requiere, como secretos del proyecto de Supabase (nunca en el cliente):
//   supabase secrets set BRAVE_SEARCH_API_KEY=...
//   supabase secrets set ANTHROPIC_API_KEY=...
//
// Despliegue:
//   supabase functions deploy busqueda-recomendaciones
//
// Este archivo se escribió siguiendo los patrones oficiales de Supabase Edge
// Functions (Deno) pero no pudo desplegarse ni probarse en este entorno por no
// contar con un proyecto de Supabase real, una clave de API de búsqueda ni
// credenciales de IA — ver limitación documentada en la Fase 5.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const LIMITE_SOLICITUDES_POR_DIA = 10;
const MODELO_IA = 'claude-sonnet-5';

// Dominios de reguladores, banco central y entidades supervisadas priorizados en
// la búsqueda, siguiendo la instrucción explícita de la §19 del prompt maestro.
const DOMINIOS_PRIORITARIOS = [
  'banguat.gob.gt',
  'sib.gob.gt',
  'mineco.gob.gt',
  'minfin.gob.gt',
  'bvnsa.com.gt',
  'rmvm.gob.gt',
];

interface CuerpoSolicitud {
  interes: string;
  monto?: number;
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
  const claveBusqueda = Deno.env.get('BRAVE_SEARCH_API_KEY');
  const claveIA = Deno.env.get('ANTHROPIC_API_KEY');
  if (!urlSupabase || !claveAnonima || !claveBusqueda || !claveIA) {
    return respuestaJSON({ error: 'La función no está configurada correctamente en el servidor.' }, 500);
  }

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
    return respuestaJSON({ error: 'Has alcanzado el límite de búsquedas por día. Intenta más tarde.' }, 429);
  }

  let cuerpo: CuerpoSolicitud;
  try {
    cuerpo = await req.json();
  } catch {
    return respuestaJSON({ error: 'Solicitud inválida.' }, 400);
  }
  if (!cuerpo.interes || typeof cuerpo.interes !== 'string') {
    return respuestaJSON({ error: 'El interés es requerido.' }, 400);
  }

  try {
    const resultadosBusqueda = await buscarEnFuentesPrioritarias(cuerpo.interes, claveBusqueda);
    const alternativas = await estructurarConIA(cuerpo, resultadosBusqueda, claveIA);
    await guardarRecomendacion(supabase, user.id, cuerpo.interes, alternativas);
    return respuestaJSON({ alternativas });
  } catch (error) {
    console.error('Fallo en la búsqueda de recomendaciones', error instanceof Error ? error.message : 'error desconocido');
    return respuestaJSON({ error: 'No se pudo completar la búsqueda en este momento.' }, 502);
  }
});

async function verificarLimiteSolicitudes(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string
): Promise<boolean> {
  const haceUnDia = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('limites_solicitudes_busqueda')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .gte('creado_en', haceUnDia);

  if ((count ?? 0) >= LIMITE_SOLICITUDES_POR_DIA) return false;

  await supabase.from('limites_solicitudes_busqueda').insert({ usuario_id: usuarioId });
  return true;
}

interface ResultadoBusqueda {
  titulo: string;
  url: string;
  fragmento: string;
}

async function buscarEnFuentesPrioritarias(interes: string, claveBusqueda: string): Promise<ResultadoBusqueda[]> {
  const filtroSitios = DOMINIOS_PRIORITARIOS.map((dominio) => `site:${dominio}`).join(' OR ');
  const consulta = `${interes} Guatemala (${filtroSitios})`;

  const respuesta = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(consulta)}&count=8`, {
    headers: { 'X-Subscription-Token': claveBusqueda, Accept: 'application/json' },
  });
  if (!respuesta.ok) {
    throw new Error(`El proveedor de búsqueda respondió con estado ${respuesta.status}`);
  }
  const datos = await respuesta.json();
  const resultados = datos?.web?.results ?? [];
  return resultados.map((r: { title: string; url: string; description: string }) => ({
    titulo: r.title,
    url: r.url,
    fragmento: r.description,
  }));
}

async function estructurarConIA(
  cuerpo: CuerpoSolicitud,
  resultados: ResultadoBusqueda[],
  claveIA: string
): Promise<unknown> {
  const promptSistema = `Eres un asistente educativo financiero. A partir de estos resultados de búsqueda web (fuentes oficiales de Guatemala),
extrae alternativas relacionadas con el interés "${cuerpo.interes}". Responde SOLO con JSON: un arreglo de objetos con las claves
nombre, descripcion, capitalMinimo, riesgo ("bajo"|"medio"|"alto"), liquidez, costos, ventajas, riesgos, pais, fuentes (arreglo de {titulo, entidad, url}).
No inventes datos que no estén respaldados por los resultados. Si un dato no es verificable, indícalo explícitamente en el texto en vez de inventarlo.
Responde en el idioma "${cuerpo.idioma}".

Resultados:
${JSON.stringify(resultados)}`;

  const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claveIA,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODELO_IA,
      max_tokens: 1500,
      system: promptSistema,
      messages: [{ role: 'user', content: 'Genera las alternativas estructuradas en JSON.' }],
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`El proveedor de IA respondió con estado ${respuesta.status}`);
  }
  const datos = await respuesta.json();
  const texto = datos?.content?.[0]?.text;
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error('La IA no devolvió un JSON válido');
  }
}

async function guardarRecomendacion(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string,
  interes: string,
  alternativas: unknown
): Promise<void> {
  await supabase.from('recomendaciones').insert({
    usuario_id: usuarioId,
    tipo: interes,
    contenido: JSON.stringify(alternativas),
    nivel_riesgo: 'medio',
  });
}
