import { eliminarLaravel, obtenerLaravel, postLaravel, putLaravel } from '@/src/servicios/laravelApi/cliente';
import type { DatosPresupuestoCapacitacionAPI, PresupuestoCapacitacionAPI } from '@/src/tipos/laravelApi';

export function listarPresupuestosCapacitacion(): Promise<PresupuestoCapacitacionAPI[]> {
  return obtenerLaravel<PresupuestoCapacitacionAPI[]>('/presupuestos-capacitacion');
}

export function crearPresupuestoCapacitacion(
  datos: DatosPresupuestoCapacitacionAPI
): Promise<PresupuestoCapacitacionAPI> {
  return postLaravel<PresupuestoCapacitacionAPI>('/presupuestos-capacitacion', datos);
}

export function actualizarPresupuestoCapacitacion(
  id: number,
  datos: Partial<DatosPresupuestoCapacitacionAPI>
): Promise<PresupuestoCapacitacionAPI> {
  return putLaravel<PresupuestoCapacitacionAPI>(`/presupuestos-capacitacion/${id}`, datos);
}

export function eliminarPresupuestoCapacitacion(id: number): Promise<void> {
  return eliminarLaravel(`/presupuestos-capacitacion/${id}`);
}
