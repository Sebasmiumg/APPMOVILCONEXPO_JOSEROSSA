export interface Presupuesto {
  id: string;
  categoriaId: string;
  periodo: string; // 'AAAA-MM'
  limite: number;
  porcentajeAlerta: number;
  creadoEn: string;
}

export interface FilaPresupuestoSQL {
  id: string;
  categoria_id: string;
  periodo: string;
  limite: number;
  porcentaje_alerta: number;
  creado_en: string;
}

export function mapearFilaPresupuesto(fila: FilaPresupuestoSQL): Presupuesto {
  return {
    id: fila.id,
    categoriaId: fila.categoria_id,
    periodo: fila.periodo,
    limite: fila.limite,
    porcentajeAlerta: fila.porcentaje_alerta,
    creadoEn: fila.creado_en,
  };
}

export type EstadoPresupuesto = 'normal' | 'advertencia' | 'excedido';

export interface ConsumoPresupuesto {
  usado: number;
  disponible: number;
  porcentaje: number;
  estado: EstadoPresupuesto;
}
