export type OperacionSincronizacion = 'insertar' | 'actualizar' | 'eliminar';

export type TablaSincronizable = 'cuentas' | 'categorias' | 'movimientos' | 'presupuestos' | 'metas' | 'aportes_meta';

export interface EntradaColaSincronizacion {
  id: string;
  tabla: TablaSincronizable;
  registroId: string;
  operacion: OperacionSincronizacion;
  payload: Record<string, unknown> | null;
  creadoEn: string;
  sincronizado: boolean;
  intentos: number;
}

export interface FilaColaSincronizacionSQL {
  id: string;
  tabla: string;
  registro_id: string;
  operacion: string;
  payload: string | null;
  creado_en: string;
  sincronizado: number;
  intentos: number;
}

export function mapearFilaColaSincronizacion(fila: FilaColaSincronizacionSQL): EntradaColaSincronizacion {
  return {
    id: fila.id,
    tabla: fila.tabla as TablaSincronizable,
    registroId: fila.registro_id,
    operacion: fila.operacion as OperacionSincronizacion,
    payload: fila.payload ? JSON.parse(fila.payload) : null,
    creadoEn: fila.creado_en,
    sincronizado: fila.sincronizado === 1,
    intentos: fila.intentos,
  };
}
