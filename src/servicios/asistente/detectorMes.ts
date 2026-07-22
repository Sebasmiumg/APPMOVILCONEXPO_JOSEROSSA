import type { CodigoIdioma } from '@/src/idiomas/configuracionIdioma';

const LOCALES_POR_IDIOMA: Record<CodigoIdioma, string> = {
  es: 'es-GT',
  en: 'en-US',
  zh: 'zh-CN',
  hi: 'hi-IN',
  ar: 'ar-EG',
};

export interface RangoMesDetectado {
  inicio: string;
  fin: string;
  etiqueta: string;
}

// Usa Intl para reconocer el nombre de un mes escrito en el idioma actual dentro de
// una pregunta libre (p. ej. "¿cuánto gasté en julio?"), evitando mantener una lista
// de nombres de mes traducidos a mano para cada idioma soportado.
export function detectarMesEnTexto(
  texto: string,
  idioma: CodigoIdioma,
  fechaReferencia: Date = new Date()
): RangoMesDetectado | null {
  const normalizado = texto.toLowerCase();
  const locale = LOCALES_POR_IDIOMA[idioma];
  const anioActual = fechaReferencia.getFullYear();
  const mesActual = fechaReferencia.getMonth();

  for (let mes = 0; mes < 12; mes += 1) {
    const nombreMes = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, mes, 1)).toLowerCase();
    if (normalizado.includes(nombreMes)) {
      const anio = mes > mesActual ? anioActual - 1 : anioActual;
      const inicio = new Date(anio, mes, 1);
      const fin = new Date(anio, mes + 1, 0, 23, 59, 59, 999);
      return {
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        etiqueta: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(inicio),
      };
    }
  }
  return null;
}
