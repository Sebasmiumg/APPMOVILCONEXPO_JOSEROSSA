import type { Cuenta } from '@/src/tipos/cuenta';
import type { Movimiento } from '@/src/tipos/movimiento';

export interface ResumenPeriodo {
  ingresos: number;
  gastos: number;
  ahorroNeto: number;
  tasaAhorro: number;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// Efecto firmado de un movimiento sobre el saldo de una cuenta específica.
// El "ajuste" se trata como una corrección positiva (ver limitación documentada
// en app/movimiento/nuevo.tsx); para corregir el saldo a la baja se registra un gasto.
export function efectoMovimientoEnCuenta(movimiento: Movimiento, cuentaId: string): number {
  switch (movimiento.tipo) {
    case 'ingreso':
    case 'ajuste':
      return movimiento.cuentaId === cuentaId ? movimiento.monto : 0;
    case 'gasto':
      return movimiento.cuentaId === cuentaId ? -movimiento.monto : 0;
    case 'transferencia': {
      let efecto = 0;
      if (movimiento.cuentaId === cuentaId) efecto -= movimiento.monto;
      if (movimiento.cuentaDestinoId === cuentaId) efecto += movimiento.monto;
      return efecto;
    }
    default:
      return 0;
  }
}

export function calcularSaldoCuenta(cuenta: Cuenta, movimientos: readonly Movimiento[]): number {
  const total = movimientos.reduce((acumulado, movimiento) => acumulado + efectoMovimientoEnCuenta(movimiento, cuenta.id), cuenta.saldoInicial);
  return redondear(total);
}

export function calcularSaldoTotal(cuentas: readonly Cuenta[], movimientos: readonly Movimiento[]): number {
  return redondear(cuentas.reduce((acumulado, cuenta) => acumulado + calcularSaldoCuenta(cuenta, movimientos), 0));
}

export function filtrarMovimientosPorPeriodo(
  movimientos: readonly Movimiento[],
  inicioISO: string,
  finISO: string
): Movimiento[] {
  return movimientos.filter((m) => m.fechaMovimiento >= inicioISO && m.fechaMovimiento <= finISO);
}

export function calcularResumenPeriodo(movimientos: readonly Movimiento[]): ResumenPeriodo {
  const ingresos = redondear(
    movimientos.filter((m) => m.tipo === 'ingreso').reduce((total, m) => total + m.monto, 0)
  );
  const gastos = redondear(
    movimientos.filter((m) => m.tipo === 'gasto').reduce((total, m) => total + m.monto, 0)
  );
  const ahorroNeto = redondear(ingresos - gastos);
  const tasaAhorro = ingresos > 0 ? redondear((ahorroNeto / ingresos) * 100) : 0;

  return { ingresos, gastos, ahorroNeto, tasaAhorro };
}

export function obtenerRangoMes(fechaReferencia: Date = new Date(), desplazamientoMeses = 0): { inicio: string; fin: string } {
  const inicio = new Date(fechaReferencia.getFullYear(), fechaReferencia.getMonth() + desplazamientoMeses, 1);
  const fin = new Date(fechaReferencia.getFullYear(), fechaReferencia.getMonth() + desplazamientoMeses + 1, 0, 23, 59, 59, 999);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

export function obtenerRangoMesActual(fechaReferencia: Date = new Date()): { inicio: string; fin: string } {
  return obtenerRangoMes(fechaReferencia, 0);
}

export function obtenerRangoMesAnterior(fechaReferencia: Date = new Date()): { inicio: string; fin: string } {
  return obtenerRangoMes(fechaReferencia, -1);
}
