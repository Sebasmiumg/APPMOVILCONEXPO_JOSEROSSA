import { eliminarLaravel, obtenerLaravel, postLaravel, putLaravel } from '@/src/servicios/laravelApi/cliente';
import type { DatosMovimientoAPI, MovimientoAPI } from '@/src/tipos/laravelApi';

export function listarMovimientosAPI(): Promise<MovimientoAPI[]> {
  return obtenerLaravel<MovimientoAPI[]>('/movimientos');
}

export function crearMovimientoAPI(datos: DatosMovimientoAPI): Promise<MovimientoAPI> {
  return postLaravel<MovimientoAPI>('/movimientos', datos);
}

export function actualizarMovimientoAPI(id: number, datos: Partial<DatosMovimientoAPI>): Promise<MovimientoAPI> {
  return putLaravel<MovimientoAPI>(`/movimientos/${id}`, datos);
}

export function eliminarMovimientoAPI(id: number): Promise<void> {
  return eliminarLaravel(`/movimientos/${id}`);
}
