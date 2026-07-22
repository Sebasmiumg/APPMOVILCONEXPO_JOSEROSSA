export type EstadoMeta = 'activa' | 'completada' | 'archivada';

export interface Meta {
  id: string;
  cuentaId: string | null;
  nombre: string;
  montoObjetivo: number;
  montoActual: number;
  fechaObjetivo: string | null;
  estado: EstadoMeta;
  creadaEn: string;
}

export interface FilaMetaSQL {
  id: string;
  cuenta_id: string | null;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_objetivo: string | null;
  estado: string;
  creada_en: string;
}

export function mapearFilaMeta(fila: FilaMetaSQL): Meta {
  return {
    id: fila.id,
    cuentaId: fila.cuenta_id,
    nombre: fila.nombre,
    montoObjetivo: fila.monto_objetivo,
    montoActual: fila.monto_actual,
    fechaObjetivo: fila.fecha_objetivo,
    estado: fila.estado as EstadoMeta,
    creadaEn: fila.creada_en,
  };
}

export interface AporteMeta {
  id: string;
  metaId: string;
  monto: number;
  fecha: string;
  nota: string | null;
}

export interface FilaAporteMetaSQL {
  id: string;
  meta_id: string;
  monto: number;
  fecha: string;
  nota: string | null;
}

export function mapearFilaAporteMeta(fila: FilaAporteMetaSQL): AporteMeta {
  return {
    id: fila.id,
    metaId: fila.meta_id,
    monto: fila.monto,
    fecha: fila.fecha,
    nota: fila.nota,
  };
}
