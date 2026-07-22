import type { NombreIcono } from '@/src/componentes/comunes/Icono';
import type { CodigoMoneda, TipoCuenta } from '@/src/tipos/finanzas';

// GTQ es prioritario; la estructura queda lista para sumar más monedas en fases futuras.
export const MONEDAS_SOPORTADAS: readonly CodigoMoneda[] = ['GTQ', 'USD'];

export const SIMBOLOS_MONEDA: Record<CodigoMoneda, string> = {
  GTQ: 'Q',
  USD: '$',
};

export const TIPOS_CUENTA: readonly TipoCuenta[] = [
  'efectivo',
  'cuentaBancaria',
  'cuentaAhorro',
  'tarjetaCredito',
  'negocio',
  'billeteraDigital',
];

export const ICONOS_TIPO_CUENTA: Record<TipoCuenta, NombreIcono> = {
  efectivo: 'payments',
  cuentaBancaria: 'account-balance',
  cuentaAhorro: 'savings',
  tarjetaCredito: 'credit-card',
  negocio: 'storefront',
  billeteraDigital: 'account-balance-wallet',
};
