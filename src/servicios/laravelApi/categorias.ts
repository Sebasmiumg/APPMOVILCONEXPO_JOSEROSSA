import { eliminarLaravel, obtenerLaravel, postLaravel, putLaravel } from '@/src/servicios/laravelApi/cliente';
import type { CategoriaAPI, DatosCategoriaAPI } from '@/src/tipos/laravelApi';

export function listarCategoriasAPI(): Promise<CategoriaAPI[]> {
  return obtenerLaravel<CategoriaAPI[]>('/categorias');
}

export function crearCategoriaAPI(datos: DatosCategoriaAPI): Promise<CategoriaAPI> {
  return postLaravel<CategoriaAPI>('/categorias', datos);
}

export function actualizarCategoriaAPI(id: number, datos: Partial<DatosCategoriaAPI>): Promise<CategoriaAPI> {
  return putLaravel<CategoriaAPI>(`/categorias/${id}`, datos);
}

export function eliminarCategoriaAPI(id: number): Promise<void> {
  return eliminarLaravel(`/categorias/${id}`);
}
