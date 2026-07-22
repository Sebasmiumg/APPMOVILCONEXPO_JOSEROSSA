import type { CodigoIdioma } from '@/src/idiomas/configuracionIdioma';
import type { CodigoMoneda } from '@/src/tipos/finanzas';

const LOCALES_POR_IDIOMA: Record<CodigoIdioma, string> = {
  es: 'es-GT',
  en: 'en-US',
  zh: 'zh-CN',
  hi: 'hi-IN',
  ar: 'ar-EG',
};

export function formatearMoneda(monto: number, moneda: CodigoMoneda, idioma: CodigoIdioma): string {
  return new Intl.NumberFormat(LOCALES_POR_IDIOMA[idioma], {
    style: 'currency',
    currency: moneda,
    currencyDisplay: 'narrowSymbol',
  }).format(monto);
}
