import { eliminarLaravel, obtenerLaravel, postLaravel, putLaravel } from '@/src/servicios/laravelApi/cliente';
import type { DatosMetaAPI, MetaAPI } from '@/src/tipos/laravelApi';

export function listarMetasAPI(): Promise<MetaAPI[]> {
  return obtenerLaravel<MetaAPI[]>('/metas');
}

export function crearMetaAPI(datos: DatosMetaAPI): Promise<MetaAPI> {
  return postLaravel<MetaAPI>('/metas', datos);
}

export function actualizarMetaAPI(id: string, datos: Partial<DatosMetaAPI>): Promise<MetaAPI> {
  return putLaravel<MetaAPI>(`/metas/${id}`, datos);
}

export function eliminarMetaAPI(id: string): Promise<void> {
  return eliminarLaravel(`/metas/${id}`);
}
