export type TipoCuenta =
  | 'efectivo'
  | 'cuentaBancaria'
  | 'cuentaAhorro'
  | 'tarjetaCredito'
  | 'negocio'
  | 'billeteraDigital';

export type CodigoMoneda = 'GTQ' | 'USD';

export interface ConfiguracionFinancieraInicial {
  moneda: CodigoMoneda;
  nombreCuenta: string;
  tipoCuenta: TipoCuenta;
  saldoInicial: number;
  metaAhorro?: number;
  fechaObjetivo?: string;
}
