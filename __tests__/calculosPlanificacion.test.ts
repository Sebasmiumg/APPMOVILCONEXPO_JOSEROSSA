import {
  calcularAhorroSugeridoMeta,
  calcularConsumoPresupuesto,
  calcularProgresoMeta,
} from '@/src/utilidades/calculosPlanificacion';
import type { Meta } from '@/src/tipos/meta';
import type { Movimiento } from '@/src/tipos/movimiento';
import type { Presupuesto } from '@/src/tipos/presupuesto';

function crearMovimiento(parciales: Partial<Movimiento> = {}): Movimiento {
  return {
    id: 'mov-1',
    cuentaId: 'cuenta-1',
    cuentaDestinoId: null,
    movimientoRelacionadoId: null,
    tipo: 'gasto',
    monto: 100,
    categoriaId: 'cat-1',
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

function crearPresupuesto(parciales: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'pres-1',
    categoriaId: 'cat-1',
    periodo: '2026-07',
    limite: 500,
    porcentajeAlerta: 80,
    creadoEn: '2026-07-01T00:00:00.000Z',
    ...parciales,
  };
}

function crearMeta(parciales: Partial<Meta> = {}): Meta {
  return {
    id: 'meta-1',
    cuentaId: null,
    nombre: 'Computadora',
    montoObjetivo: 8000,
    montoActual: 2500,
    fechaObjetivo: null,
    estado: 'activa',
    creadaEn: '2026-01-01T00:00:00.000Z',
    ...parciales,
  };
}

describe('calcularConsumoPresupuesto', () => {
  it('marca estado normal cuando el consumo está por debajo del umbral de alerta', () => {
    const presupuesto = crearPresupuesto({ limite: 500, porcentajeAlerta: 80 });
    const resultado = calcularConsumoPresupuesto(presupuesto, [crearMovimiento({ monto: 200 })]);
    expect(resultado.usado).toBe(200);
    expect(resultado.disponible).toBe(300);
    expect(resultado.porcentaje).toBe(40);
    expect(resultado.estado).toBe('normal');
  });

  it('marca estado advertencia al superar el porcentaje de alerta', () => {
    const presupuesto = crearPresupuesto({ limite: 500, porcentajeAlerta: 80 });
    const resultado = calcularConsumoPresupuesto(presupuesto, [crearMovimiento({ monto: 420 })]);
    expect(resultado.estado).toBe('advertencia');
  });

  it('marca estado excedido cuando el gasto supera el límite', () => {
    const presupuesto = crearPresupuesto({ limite: 500 });
    const resultado = calcularConsumoPresupuesto(presupuesto, [crearMovimiento({ monto: 600 })]);
    expect(resultado.estado).toBe('excedido');
    expect(resultado.disponible).toBe(-100);
  });

  it('ignora movimientos que no son gasto', () => {
    const presupuesto = crearPresupuesto({ limite: 500 });
    const resultado = calcularConsumoPresupuesto(presupuesto, [crearMovimiento({ tipo: 'ingreso', monto: 300 })]);
    expect(resultado.usado).toBe(0);
  });
});

describe('calcularProgresoMeta', () => {
  it('calcula el porcentaje y el monto restante', () => {
    const meta = crearMeta({ montoObjetivo: 8000, montoActual: 2500 });
    const progreso = calcularProgresoMeta(meta);
    expect(progreso.porcentaje).toBeCloseTo(31.25);
    expect(progreso.restante).toBe(5500);
  });

  it('no supera el 100% aunque el aporte exceda el objetivo', () => {
    const meta = crearMeta({ montoObjetivo: 1000, montoActual: 1500 });
    const progreso = calcularProgresoMeta(meta);
    expect(progreso.porcentaje).toBe(100);
    expect(progreso.restante).toBe(0);
  });
});

describe('calcularAhorroSugeridoMeta', () => {
  it('calcula cuánto ahorrar por semana y por mes según la fecha objetivo', () => {
    const meta = crearMeta({ montoObjetivo: 1000, montoActual: 0, fechaObjetivo: '2026-08-31T00:00:00.000Z' });
    const sugerido = calcularAhorroSugeridoMeta(meta, new Date('2026-08-01T00:00:00.000Z'));
    expect(sugerido.porSemana).not.toBeNull();
    expect(sugerido.porMes).not.toBeNull();
    // Con ~30 días restantes, el monto semanal debe ser menor al mensual pero mayor que cero.
    expect(sugerido.porSemana!).toBeGreaterThan(0);
    expect(sugerido.porSemana!).toBeLessThan(sugerido.porMes!);
  });

  it('retorna null cuando no hay fecha objetivo', () => {
    const meta = crearMeta({ fechaObjetivo: null });
    const sugerido = calcularAhorroSugeridoMeta(meta);
    expect(sugerido.porSemana).toBeNull();
    expect(sugerido.porMes).toBeNull();
  });

  it('retorna null cuando la meta ya está completada', () => {
    const meta = crearMeta({ montoObjetivo: 1000, montoActual: 1000, fechaObjetivo: '2026-12-31T00:00:00.000Z' });
    const sugerido = calcularAhorroSugeridoMeta(meta);
    expect(sugerido.porSemana).toBeNull();
  });
});
