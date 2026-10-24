import { eliminarLaravel, obtenerLaravel, postLaravel } from '@/src/servicios/laravelApi/cliente';
import type { AporteMetaAPI, DatosAporteMetaAPI } from '@/src/tipos/laravelApi';

export function listarAportesMeta(metaId: string): Promise<AporteMetaAPI[]> {
  return obtenerLaravel<AporteMetaAPI[]>(`/metas/${metaId}/aportes`);
}

export function crearAporteMeta(metaId: string, datos: DatosAporteMetaAPI): Promise<AporteMetaAPI> {
  return postLaravel<AporteMetaAPI>(`/metas/${metaId}/aportes`, datos);
}

export function eliminarAporteMeta(aporteId: number): Promise<void> {
  return eliminarLaravel(`/aportes/${aporteId}`);
}
