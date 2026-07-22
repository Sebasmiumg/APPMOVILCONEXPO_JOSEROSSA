import type { CodigoMoneda, TipoCuenta } from '@/src/tipos/finanzas';

export interface Cuenta {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  moneda: CodigoMoneda;
  saldoInicial: number;
  color: string | null;
  icono: string | null;
  activa: boolean;
  creadaEn: string;
  actualizadoEn: string;
}

export interface FilaCuentaSQL {
  id: string;
  nombre: string;
  tipo: string;
  moneda: string;
  saldo_inicial: number;
  color: string | null;
  icono: string | null;
  activa: number;
  creada_en: string;
  actualizado_en: string;
}

export function mapearFilaCuenta(fila: FilaCuentaSQL): Cuenta {
  return {
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo as TipoCuenta,
    moneda: fila.moneda as CodigoMoneda,
    saldoInicial: fila.saldo_inicial,
    color: fila.color,
    icono: fila.icono,
    activa: fila.activa === 1,
    creadaEn: fila.creada_en,
    actualizadoEn: fila.actualizado_en,
  };
}
