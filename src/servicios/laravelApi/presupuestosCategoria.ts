import { eliminarLaravel, obtenerLaravel, postLaravel, putLaravel } from '@/src/servicios/laravelApi/cliente';
import type { DatosPresupuestoCategoriaAPI, PresupuestoCategoriaAPI } from '@/src/tipos/laravelApi';

export function listarPresupuestosCategoriaAPI(): Promise<PresupuestoCategoriaAPI[]> {
  return obtenerLaravel<PresupuestoCategoriaAPI[]>('/presupuestos-categoria');
}

export function crearPresupuestoCategoriaAPI(
  datos: DatosPresupuestoCategoriaAPI
): Promise<PresupuestoCategoriaAPI> {
  return postLaravel<PresupuestoCategoriaAPI>('/presupuestos-categoria', datos);
}

export function actualizarPresupuestoCategoriaAPI(
  id: string,
  datos: Partial<DatosPresupuestoCategoriaAPI>
): Promise<PresupuestoCategoriaAPI> {
  return putLaravel<PresupuestoCategoriaAPI>(`/presupuestos-categoria/${id}`, datos);
}

export function eliminarPresupuestoCategoriaAPI(id: string): Promise<void> {
  return eliminarLaravel(`/presupuestos-categoria/${id}`);
}
