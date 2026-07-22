import { supabase, supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import type { CodigoIdioma } from '@/src/idiomas/configuracionIdioma';
import type { CodigoMoneda } from '@/src/tipos/finanzas';

export interface ResumenParaIA {
  periodo: string;
  ingresos: number;
  gastos: number;
  ahorroNeto: number;
  tasaAhorro: number;
  moneda: CodigoMoneda;
  categoriaMayorGasto?: string;
}

// Llama a la Edge Function asistente-ia (Nivel 2). Devuelve null ante cualquier
// fallo — incluyendo que la función aún no esté desplegada — para que la pantalla
// del asistente pueda seguir mostrando la respuesta local de forma honesta en vez
// de romperse o mostrar un error técnico al usuario.
export async function consultarAsistenteIA(
  pregunta: string,
  resumen: ResumenParaIA,
  idioma: CodigoIdioma
): Promise<string | null> {
  if (!supabaseEstaConfigurado() || !supabase) return null;

  try {
    const { data: sesion } = await supabase.auth.getSession();
    if (!sesion.session) return null;

    const { data, error } = await supabase.functions.invoke<{ respuesta?: string }>('asistente-ia', {
      body: { pregunta, resumen, idioma },
    });
    if (error || !data?.respuesta) return null;
    return data.respuesta;
  } catch {
    return null;
  }
}
