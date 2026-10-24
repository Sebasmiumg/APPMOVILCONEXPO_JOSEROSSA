import { eliminarLaravel, obtenerLaravel, postLaravel, putLaravel } from '@/src/servicios/laravelApi/cliente';
import type { CuentaAPI, DatosCuentaAPI } from '@/src/tipos/laravelApi';

export function listarCuentas(): Promise<CuentaAPI[]> {
  return obtenerLaravel<CuentaAPI[]>('/cuentas');
}

export function crearCuenta(datos: DatosCuentaAPI): Promise<CuentaAPI> {
  return postLaravel<CuentaAPI>('/cuentas', datos);
}

export function actualizarCuenta(id: string, datos: Partial<DatosCuentaAPI>): Promise<CuentaAPI> {
  return putLaravel<CuentaAPI>(`/cuentas/${id}`, datos);
}

export function eliminarCuenta(id: string): Promise<void> {
  return eliminarLaravel(`/cuentas/${id}`);
}
