import type { CodigoIdioma } from '@/src/idiomas/configuracionIdioma';
import { contienePalabraClave, extraerNumero } from '@/src/servicios/asistente/palabrasClave';
import { detectarMesEnTexto, type RangoMesDetectado } from '@/src/servicios/asistente/detectorMes';

export type Intencion =
  | { tipo: 'progresoMeta' }
  | { tipo: 'ultimosMovimientos'; cantidad: number; filtroTipo?: 'ingreso' | 'gasto' }
  | { tipo: 'categoriaMayorGasto' }
  | { tipo: 'sugerenciaReduccion' }
  | { tipo: 'comparacionMesAnterior' }
  | { tipo: 'ahorroTotal' }
  | { tipo: 'gastoPeriodo'; rango: RangoMesDetectado | null }
  | { tipo: 'ingresoPeriodo'; rango: RangoMesDetectado | null }
  | { tipo: 'noEntendido' };

const CANTIDAD_POR_DEFECTO_ULTIMOS = 5;

// Reglas en orden de prioridad: la primera que coincide gana. Todo se resuelve
// localmente por palabras clave — sin enviar la pregunta a ningún servicio externo.
export function detectarIntencion(pregunta: string, idioma: CodigoIdioma): Intencion {
  const texto = pregunta.trim();
  if (!texto) return { tipo: 'noEntendido' };

  const tiene = (clave: Parameters<typeof contienePalabraClave>[2]) => contienePalabraClave(texto, idioma, clave);

  if (tiene('meta') && tiene('puedo')) {
    return { tipo: 'progresoMeta' };
  }

  if (tiene('ultimos') || (tiene('movimientos') && !tiene('gasto') && !tiene('ingreso'))) {
    const cantidad = extraerNumero(texto) ?? CANTIDAD_POR_DEFECTO_ULTIMOS;
    const filtroTipo = tiene('ingreso') ? 'ingreso' : tiene('gasto') ? 'gasto' : undefined;
    return { tipo: 'ultimosMovimientos', cantidad, filtroTipo };
  }

  if (tiene('categoria') && tiene('mayor')) {
    return { tipo: 'categoriaMayorGasto' };
  }

  if (tiene('reducir')) {
    return { tipo: 'sugerenciaReduccion' };
  }

  if (tiene('mesPasado') && (tiene('compararMas') || tiene('compararMenos') || tiene('gasto'))) {
    return { tipo: 'comparacionMesAnterior' };
  }

  if (tiene('ahorro') && !tiene('meta')) {
    return { tipo: 'ahorroTotal' };
  }

  if (tiene('gasto')) {
    const rango = detectarMesEnTexto(texto, idioma);
    return { tipo: 'gastoPeriodo', rango };
  }

  if (tiene('ingreso')) {
    const rango = detectarMesEnTexto(texto, idioma);
    return { tipo: 'ingresoPeriodo', rango };
  }

  return { tipo: 'noEntendido' };
}
