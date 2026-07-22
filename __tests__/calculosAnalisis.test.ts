import {
  calcularCategoriaConMayorGasto,
  calcularComparacionPeriodos,
  calcularGastosPorCategoria,
  calcularPromedioDiarioGasto,
  calcularProyeccionSaldo,
  calcularSaludFinanciera,
} from '@/src/utilidades/calculosAnalisis';
import type { Categoria } from '@/src/tipos/categoria';
import type { Movimiento } from '@/src/tipos/movimiento';

function crearMovimiento(parciales: Partial<Movimiento> = {}): Movimiento {
  return {
    id: 'mov-1',
    cuentaId: 'cuenta-1',
    cuentaDestinoId: null,
    movimientoRelacionadoId: null,
    tipo: 'gasto',
    monto: 100,
    categoriaId: 'cat-alimentacion',
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

function crearCategoria(parciales: Partial<Categoria> = {}): Categoria {
  return {
    id: 'cat-alimentacion',
    tipo: 'gasto',
    claveTraduccion: 'alimentacion',
    nombrePersonalizado: null,
    icono: 'restaurant',
    color: '#7C4DFF',
    activa: true,
    ...parciales,
  };
}

describe('calcularGastosPorCategoria', () => {
  it('agrupa y calcula el porcentaje de cada categoría', () => {
    const movimientos = [
      crearMovimiento({ categoriaId: 'cat-alimentacion', monto: 300 }),
      crearMovimiento({ categoriaId: 'cat-transporte', monto: 100 }),
    ];
    const resultado = calcularGastosPorCategoria(movimientos);
    expect(resultado[0]).toEqual({ categoriaId: 'cat-alimentacion', total: 300, porcentaje: 75 });
    expect(resultado[1]).toEqual({ categoriaId: 'cat-transporte', total: 100, porcentaje: 25 });
  });

  it('ignora movimientos sin categoría o que no son gasto', () => {
    const movimientos = [
      crearMovimiento({ categoriaId: null }),
      crearMovimiento({ tipo: 'ingreso', categoriaId: 'cat-alimentacion' }),
    ];
    expect(calcularGastosPorCategoria(movimientos)).toEqual([]);
  });
});

describe('calcularCategoriaConMayorGasto', () => {
  it('identifica la categoría con más gasto', () => {
    const categorias = [crearCategoria({ id: 'cat-alimentacion' }), crearCategoria({ id: 'cat-transporte' })];
    const movimientos = [
      crearMovimiento({ categoriaId: 'cat-transporte', monto: 50 }),
      crearMovimiento({ categoriaId: 'cat-alimentacion', monto: 400 }),
    ];
    const resultado = calcularCategoriaConMayorGasto(movimientos, categorias);
    expect(resultado?.categoria.id).toBe('cat-alimentacion');
    expect(resultado?.total).toBe(400);
  });

  it('retorna null cuando no hay gastos', () => {
    expect(calcularCategoriaConMayorGasto([], [])).toBeNull();
  });
});

describe('calcularPromedioDiarioGasto', () => {
  it('divide el total de gastos entre los días transcurridos', () => {
    const movimientos = [crearMovimiento({ monto: 300 })];
    expect(calcularPromedioDiarioGasto(movimientos, 10)).toBe(30);
  });

  it('evita dividir entre cero usando al menos un día', () => {
    const movimientos = [crearMovimiento({ monto: 50 })];
    expect(calcularPromedioDiarioGasto(movimientos, 0)).toBe(50);
  });
});

describe('calcularComparacionPeriodos', () => {
  it('calcula la variación de ingresos y gastos entre dos periodos', () => {
    const actual = { ingresos: 1000, gastos: 420, ahorroNeto: 580, tasaAhorro: 58 };
    const anterior = { ingresos: 900, gastos: 300, ahorroNeto: 600, tasaAhorro: 66.67 };
    const comparacion = calcularComparacionPeriodos(actual, anterior);
    expect(comparacion.variacionIngresos).toBe(100);
    expect(comparacion.variacionGastos).toBe(120);
    expect(comparacion.porcentajeVariacionGastos).toBe(40);
  });

  it('retorna null en el porcentaje cuando el periodo anterior no tuvo gastos', () => {
    const actual = { ingresos: 500, gastos: 100, ahorroNeto: 400, tasaAhorro: 80 };
    const anterior = { ingresos: 500, gastos: 0, ahorroNeto: 500, tasaAhorro: 100 };
    expect(calcularComparacionPeriodos(actual, anterior).porcentajeVariacionGastos).toBeNull();
  });
});

describe('calcularSaludFinanciera', () => {
  it('retorna verde cuando la tasa de ahorro es alta', () => {
    expect(calcularSaludFinanciera(25)).toBe('verde');
  });
  it('retorna amarillo en tasas moderadas', () => {
    expect(calcularSaludFinanciera(10)).toBe('amarillo');
  });
  it('retorna rojo cuando se gasta más de lo que se ingresa', () => {
    expect(calcularSaludFinanciera(-5)).toBe('rojo');
  });
});

describe('calcularProyeccionSaldo', () => {
  it('proyecta el saldo de fin de mes según el ritmo de ahorro actual', () => {
    // Ahorro de 300 en 10 días transcurridos de un mes de 30 días => 30/día * 20 días restantes = 600
    const proyeccion = calcularProyeccionSaldo(1000, 300, 10, 30);
    expect(proyeccion).toBe(1600);
  });

  it('no agrega proyección cuando ya es el último día del mes', () => {
    const proyeccion = calcularProyeccionSaldo(1000, 300, 30, 30);
    expect(proyeccion).toBe(1000);
  });
});
