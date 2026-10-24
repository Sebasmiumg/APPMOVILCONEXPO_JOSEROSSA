import {
  calcularResumenPeriodo,
  calcularSaldoCuenta,
  calcularSaldoTotal,
  filtrarMovimientosPorPeriodo,
  obtenerRangoMesActual,
} from '@/src/utilidades/calculosFinancieros';
import type { Cuenta } from '@/src/tipos/cuenta';
import type { Movimiento } from '@/src/tipos/movimiento';

function crearCuenta(parciales: Partial<Cuenta> = {}): Cuenta {
  return {
    id: 'cuenta-1',
    nombre: 'Principal',
    tipo: 'efectivo',
    moneda: 'GTQ',
    saldoInicial: 1000,
    color: null,
    icono: null,
    activa: true,
    creadaEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...parciales,
  };
}

function crearMovimiento(parciales: Partial<Movimiento> = {}): Movimiento {
  return {
    id: 'mov-1',
    cuentaId: 'cuenta-1',
    cuentaDestinoId: null,
    movimientoRelacionadoId: null,
    tipo: 'gasto',
    monto: 100,
    categoriaId: null,
    descripcion: null,
    notas: null,
    fechaMovimiento: '2026-07-10T00:00:00.000Z',
    comprobanteUrl: null,
    recurrente: false,
    creadoEn: '2026-07-10T00:00:00.000Z',
    actualizadoEn: '2026-07-10T00:00:00.000Z',
    ...parciales,
  };
}

describe('calcularSaldoCuenta', () => {
  it('suma ingresos y resta gastos al saldo inicial', () => {
    const cuenta = crearCuenta({ saldoInicial: 1000 });
    const movimientos = [
      crearMovimiento({ tipo: 'ingreso', monto: 500 }),
      crearMovimiento({ tipo: 'gasto', monto: 200 }),
    ];
    expect(calcularSaldoCuenta(cuenta, movimientos)).toBe(1300);
  });

  it('ignora movimientos de otras cuentas', () => {
    const cuenta = crearCuenta({ id: 'cuenta-1', saldoInicial: 1000 });
    const movimientos = [crearMovimiento({ cuentaId: 'cuenta-2', tipo: 'gasto', monto: 900 })];
    expect(calcularSaldoCuenta(cuenta, movimientos)).toBe(1000);
  });

  it('conserva centavos tras acumular varios movimientos pequeños', () => {
    const cuenta = crearCuenta({ saldoInicial: 0 });
    const movimientos = [
      crearMovimiento({ id: 'a', tipo: 'ingreso', monto: 0.1 }),
      crearMovimiento({ id: 'b', tipo: 'ingreso', monto: 0.2 }),
      crearMovimiento({ id: 'c', tipo: 'gasto', monto: 0.1 }),
    ];

    expect(calcularSaldoCuenta(cuenta, movimientos)).toBe(0.2);
  });

  it('permite que el saldo quede negativo cuando los gastos exceden los fondos', () => {
    const cuenta = crearCuenta({ saldoInicial: 50 });

    expect(calcularSaldoCuenta(cuenta, [crearMovimiento({ monto: 75 })])).toBe(-25);
  });
});

describe('transferencias', () => {
  it('resta de la cuenta origen y suma a la cuenta destino sin alterar el patrimonio total', () => {
    const origen = crearCuenta({ id: 'origen', saldoInicial: 1000 });
    const destino = crearCuenta({ id: 'destino', saldoInicial: 500 });
    const transferencia = crearMovimiento({
      tipo: 'transferencia',
      cuentaId: 'origen',
      cuentaDestinoId: 'destino',
      monto: 300,
    });

    expect(calcularSaldoCuenta(origen, [transferencia])).toBe(700);
    expect(calcularSaldoCuenta(destino, [transferencia])).toBe(800);
    expect(calcularSaldoTotal([origen, destino], [transferencia])).toBe(1500);
  });

  it('no afecta el resumen de ingresos y gastos del periodo', () => {
    const transferencia = crearMovimiento({ tipo: 'transferencia', monto: 300 });
    const resumen = calcularResumenPeriodo([transferencia]);
    expect(resumen.ingresos).toBe(0);
    expect(resumen.gastos).toBe(0);
  });
});

describe('calcularResumenPeriodo', () => {
  it('calcula ahorro neto y tasa de ahorro correctamente', () => {
    const movimientos = [
      crearMovimiento({ tipo: 'ingreso', monto: 1000 }),
      crearMovimiento({ tipo: 'gasto', monto: 250 }),
    ];
    const resumen = calcularResumenPeriodo(movimientos);
    expect(resumen.ingresos).toBe(1000);
    expect(resumen.gastos).toBe(250);
    expect(resumen.ahorroNeto).toBe(750);
    expect(resumen.tasaAhorro).toBe(75);
  });

  it('retorna tasa de ahorro cero cuando no hay ingresos, sin dividir entre cero', () => {
    const resumen = calcularResumenPeriodo([crearMovimiento({ tipo: 'gasto', monto: 100 })]);
    expect(resumen.tasaAhorro).toBe(0);
  });
});

describe('filtrarMovimientosPorPeriodo', () => {
  it('incluye solo movimientos dentro del rango de fechas', () => {
    const movimientos = [
      crearMovimiento({ id: 'a', fechaMovimiento: '2026-06-25T00:00:00.000Z' }),
      crearMovimiento({ id: 'b', fechaMovimiento: '2026-07-15T00:00:00.000Z' }),
      crearMovimiento({ id: 'c', fechaMovimiento: '2026-08-05T00:00:00.000Z' }),
    ];
    const { inicio, fin } = obtenerRangoMesActual(new Date('2026-07-15T12:00:00.000Z'));
    const filtrados = filtrarMovimientosPorPeriodo(movimientos, inicio, fin);
    expect(filtrados.map((m) => m.id)).toEqual(['b']);
  });

  it('incluye ambos extremos exactos del periodo y excluye el milisegundo exterior', () => {
    const { inicio, fin } = obtenerRangoMesActual(new Date('2026-07-15T12:00:00.000Z'));
    const movimientos = [
      crearMovimiento({ id: 'antes', fechaMovimiento: new Date(Date.parse(inicio) - 1).toISOString() }),
      crearMovimiento({ id: 'inicio', fechaMovimiento: inicio }),
      crearMovimiento({ id: 'fin', fechaMovimiento: fin }),
      crearMovimiento({ id: 'despues', fechaMovimiento: new Date(Date.parse(fin) + 1).toISOString() }),
    ];

    expect(filtrarMovimientosPorPeriodo(movimientos, inicio, fin).map((movimiento) => movimiento.id)).toEqual([
      'inicio',
      'fin',
    ]);
  });
});
