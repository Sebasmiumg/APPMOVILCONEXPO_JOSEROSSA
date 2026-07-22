export type TipoMovimiento = 'ingreso' | 'gasto' | 'transferencia' | 'ajuste';

export interface Movimiento {
  id: string;
  cuentaId: string;
  cuentaDestinoId: string | null;
  movimientoRelacionadoId: string | null;
  tipo: TipoMovimiento;
  monto: number;
  categoriaId: string | null;
  descripcion: string | null;
  notas: string | null;
  fechaMovimiento: string;
  comprobanteUrl: string | null;
  recurrente: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface FilaMovimientoSQL {
  id: string;
  cuenta_id: string;
  cuenta_destino_id: string | null;
  movimiento_relacionado_id: string | null;
  tipo: string;
  monto: number;
  categoria_id: string | null;
  descripcion: string | null;
  notas: string | null;
  fecha_movimiento: string;
  comprobante_url: string | null;
  recurrente: number;
  creado_en: string;
  actualizado_en: string;
}

export function mapearFilaMovimiento(fila: FilaMovimientoSQL): Movimiento {
  return {
    id: fila.id,
    cuentaId: fila.cuenta_id,
    cuentaDestinoId: fila.cuenta_destino_id,
    movimientoRelacionadoId: fila.movimiento_relacionado_id,
    tipo: fila.tipo as TipoMovimiento,
    monto: fila.monto,
    categoriaId: fila.categoria_id,
    descripcion: fila.descripcion,
    notas: fila.notas,
    fechaMovimiento: fila.fecha_movimiento,
    comprobanteUrl: fila.comprobante_url,
    recurrente: fila.recurrente === 1,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}
