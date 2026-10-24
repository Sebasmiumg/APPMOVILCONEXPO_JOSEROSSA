import {
  eliminarPreferencia,
  guardarPreferencia,
  obtenerPreferencia,
} from '@/src/almacenamiento/preferenciasDispositivo';
import { CLAVES_ALMACENAMIENTO } from '@/src/constantes/almacenamiento';
import type { ConfiguracionFinancieraInicial } from '@/src/tipos/finanzas';
import { supabase } from '@/src/servicios/supabase/cliente';

async function usuarioActualId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function claveConfiguracion(usuarioId: string | null): string {
  return usuarioId
    ? `${CLAVES_ALMACENAMIENTO.configuracionFinancieraInicial}.${usuarioId}`
    : CLAVES_ALMACENAMIENTO.configuracionFinancieraInicial;
}

function claveCompleta(usuarioId: string | null): string {
  return usuarioId
    ? `${CLAVES_ALMACENAMIENTO.configuracionInicialCompleta}.${usuarioId}`
    : CLAVES_ALMACENAMIENTO.configuracionInicialCompleta;
}

export async function guardarConfiguracionFinancieraInicial(
  configuracion: ConfiguracionFinancieraInicial
): Promise<void> {
  const usuarioId = await usuarioActualId();
  await guardarPreferencia(
    claveConfiguracion(usuarioId),
    JSON.stringify(configuracion)
  );
}

export async function obtenerConfiguracionFinancieraInicial(): Promise<ConfiguracionFinancieraInicial | null> {
  const crudo = await obtenerPreferencia(claveConfiguracion(await usuarioActualId()));
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as ConfiguracionFinancieraInicial;
  } catch {
    return null;
  }
}

// Permite llegar a la pantalla principal sin crear ninguna cuenta/meta todavía
// (el usuario puede crearlas después desde Movimientos/Metas). No guarda un
// ConfiguracionFinancieraInicial porque no hay ninguno: solo evita que el
// onboarding se repita en cada apertura de la app.
export async function omitirConfiguracionFinancieraInicial(): Promise<void> {
  await marcarConfiguracionInicialCompleta();
}

export async function configuracionInicialEstaCompleta(): Promise<boolean> {
  const usuarioId = await usuarioActualId();
  const clave = claveCompleta(usuarioId);

  if (usuarioId && supabase) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('configuracion_completa')
      .eq('id', usuarioId)
      .maybeSingle();
    if (perfil?.configuracion_completa) {
      await guardarPreferencia(clave, 'true');
      return true;
    }

    // Users that already have finance data (for example, created before the
    // profile flag was wired up) should not be sent through onboarding again.
    const { data: cuentas } = await supabase.from('cuentas').select('id').limit(1);
    if (cuentas?.length) {
      await marcarConfiguracionInicialCompleta(usuarioId);
      return true;
    }
  }

  return (await obtenerPreferencia(clave)) === 'true';
}

export async function restablecerConfiguracionInicial(): Promise<void> {
  await eliminarPreferencia(CLAVES_ALMACENAMIENTO.configuracionFinancieraInicial);
  await eliminarPreferencia(CLAVES_ALMACENAMIENTO.configuracionInicialCompleta);
}

export async function marcarConfiguracionInicialCompleta(usuarioId?: string | null): Promise<void> {
  const id = usuarioId === undefined ? await usuarioActualId() : usuarioId;
  await guardarPreferencia(claveCompleta(id), 'true');
  if (id && supabase) {
    await supabase.from('perfiles').update({ configuracion_completa: true }).eq('id', id);
  }
}
