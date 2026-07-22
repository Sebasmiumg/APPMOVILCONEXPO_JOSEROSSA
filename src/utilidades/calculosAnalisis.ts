import type { Categoria } from '@/src/tipos/categoria';
import type { Movimiento } from '@/src/tipos/movimiento';
import type { ResumenPeriodo } from '@/src/utilidades/calculosFinancieros';

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export interface GastoPorCategoria {
  categoriaId: string;
  total: number;
  porcentaje: number;
}

export function calcularGastosPorCategoria(movimientos: readonly Movimiento[]): GastoPorCategoria[] {
  const gastos = movimientos.filter((m) => m.tipo === 'gasto' && m.categoriaId);
  const totalGeneral = gastos.reduce((total, m) => total + m.monto, 0);

  const totalesPorCategoria = new Map<string, number>();
  for (const movimiento of gastos) {
    const categoriaId = movimiento.categoriaId as string;
    totalesPorCategoria.set(categoriaId, (totalesPorCategoria.get(categoriaId) ?? 0) + movimiento.monto);
  }

  return Array.from(totalesPorCategoria.entries())
    .map(([categoriaId, total]) => ({
      categoriaId,
      total: redondear(total),
      porcentaje: totalGeneral > 0 ? redondear((total / totalGeneral) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calcularCategoriaConMayorGasto(
  movimientos: readonly Movimiento[],
  categorias: readonly Categoria[]
): { categoria: Categoria; total: number } | null {
  const [primero] = calcularGastosPorCategoria(movimientos);
  if (!primero) return null;
  const categoria = categorias.find((c) => c.id === primero.categoriaId);
  return categoria ? { categoria, total: primero.total } : null;
}

export function calcularPromedioDiarioGasto(movimientos: readonly Movimiento[], diasTranscurridos: number): number {
  const totalGastos = movimientos.filter((m) => m.tipo === 'gasto').reduce((total, m) => total + m.monto, 0);
  const dias = Math.max(1, diasTranscurridos);
  return redondear(totalGastos / dias);
}

export interface ComparacionPeriodo {
  variacionIngresos: number;
  variacionGastos: number;
  porcentajeVariacionGastos: number | null;
}

export function calcularComparacionPeriodos(actual: ResumenPeriodo, anterior: ResumenPeriodo): ComparacionPeriodo {
  return {
    variacionIngresos: redondear(actual.ingresos - anterior.ingresos),
    variacionGastos: redondear(actual.gastos - anterior.gastos),
    porcentajeVariacionGastos:
      anterior.gastos > 0 ? redondear(((actual.gastos - anterior.gastos) / anterior.gastos) * 100) : null,
  };
}

export type NivelSaludFinanciera = 'verde' | 'amarillo' | 'rojo';

// Umbrales explícitos y documentados: >=20% de tasa de ahorro es saludable (verde),
// entre 0% y 20% es mejorable (amarillo), y negativo significa gastar más de lo que
// se ingresa (rojo). Ver AGENTS.md §16 "explicar las fórmulas y supuestos".
export function calcularSaludFinanciera(tasaAhorro: number): NivelSaludFinanciera {
  if (tasaAhorro >= 20) return 'verde';
  if (tasaAhorro >= 0) return 'amarillo';
  return 'rojo';
}

export function calcularProyeccionSaldo(
  saldoActual: number,
  ahorroNetoHastaHoy: number,
  diaDelMes: number,
  diasEnElMes: number
): number {
  const diasTranscurridos = Math.max(1, diaDelMes);
  const diasRestantes = Math.max(0, diasEnElMes - diasTranscurridos);
  const ahorroPromedioDiario = ahorroNetoHastaHoy / diasTranscurridos;
  return redondear(saldoActual + ahorroPromedioDiario * diasRestantes);
}
