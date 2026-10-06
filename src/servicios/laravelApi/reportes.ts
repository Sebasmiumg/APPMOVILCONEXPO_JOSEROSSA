import { obtenerLaravel } from '@/src/servicios/laravelApi/cliente';
import type { ReporteMensualAPI } from '@/src/tipos/laravelApi';

export function obtenerReporteMovimientosPorMes(anio?: number): Promise<ReporteMensualAPI[]> {
  const consulta = anio ? `?anio=${anio}` : '';
  return obtenerLaravel<ReporteMensualAPI[]>(`/reportes/movimientos-por-mes${consulta}`);
}
