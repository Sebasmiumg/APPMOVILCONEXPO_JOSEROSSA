import type { ConsumoPresupuesto, Presupuesto } from '@/src/tipos/presupuesto';
import type { Meta } from '@/src/tipos/meta';
import type { Movimiento } from '@/src/tipos/movimiento';

const MILISEGUNDOS_POR_DIA = 1000 * 60 * 60 * 24;

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularConsumoPresupuesto(
  presupuesto: Presupuesto,
  movimientosDeLaCategoriaEnElPeriodo: readonly Movimiento[]
): ConsumoPresupuesto {
  const usado = redondear(
    movimientosDeLaCategoriaEnElPeriodo
      .filter((m) => m.tipo === 'gasto')
      .reduce((total, m) => total + m.monto, 0)
  );
  const disponible = redondear(presupuesto.limite - usado);
  const porcentaje = presupuesto.limite > 0 ? redondear((usado / presupuesto.limite) * 100) : 0;
  const estado = porcentaje >= 100 ? 'excedido' : porcentaje >= presupuesto.porcentajeAlerta ? 'advertencia' : 'normal';

  return { usado, disponible, porcentaje, estado };
}

export interface ProgresoMeta {
  porcentaje: number;
  restante: number;
}

export function calcularProgresoMeta(meta: Meta): ProgresoMeta {
  const porcentaje = meta.montoObjetivo > 0 ? Math.min(100, redondear((meta.montoActual / meta.montoObjetivo) * 100)) : 0;
  const restante = Math.max(0, redondear(meta.montoObjetivo - meta.montoActual));
  return { porcentaje, restante };
}

export interface AhorroSugeridoMeta {
  porSemana: number | null;
  porMes: number | null;
}

export function calcularAhorroSugeridoMeta(meta: Meta, fechaActual: Date = new Date()): AhorroSugeridoMeta {
  const { restante } = calcularProgresoMeta(meta);
  if (!meta.fechaObjetivo || restante <= 0) {
    return { porSemana: null, porMes: null };
  }

  const fechaObjetivo = new Date(meta.fechaObjetivo);
  const diasRestantes = Math.max(1, Math.ceil((fechaObjetivo.getTime() - fechaActual.getTime()) / MILISEGUNDOS_POR_DIA));
  const semanasRestantes = Math.max(1, diasRestantes / 7);
  const mesesRestantes = Math.max(1, diasRestantes / 30);

  return {
    porSemana: redondear(restante / semanasRestantes),
    porMes: redondear(restante / mesesRestantes),
  };
}
