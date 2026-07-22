import type { AporteMeta, Meta } from '@/src/tipos/meta';
import type { Categoria } from '@/src/tipos/categoria';
import type { Cuenta } from '@/src/tipos/cuenta';
import type { Movimiento } from '@/src/tipos/movimiento';
import type { Presupuesto } from '@/src/tipos/presupuesto';
import { compartirArchivoTexto } from '@/src/servicios/reportes/exportarReporte';

export interface DatosExportables {
  generadoEn: string;
  cuentas: Cuenta[];
  categoriasPersonalizadas: Categoria[];
  movimientos: Movimiento[];
  presupuestos: Presupuesto[];
  metas: (Meta & { aportes: AporteMeta[] })[];
}

export async function exportarDatosUsuario(datos: {
  cuentas: Cuenta[];
  categorias: Categoria[];
  movimientos: Movimiento[];
  presupuestos: Presupuesto[];
  metas: Meta[];
  obtenerAportesMeta: (metaId: string) => Promise<AporteMeta[]>;
}): Promise<void> {
  const metasConAportes = await Promise.all(
    datos.metas.map(async (meta) => ({ ...meta, aportes: await datos.obtenerAportesMeta(meta.id) }))
  );

  const paquete: DatosExportables = {
    generadoEn: new Date().toISOString(),
    cuentas: datos.cuentas,
    categoriasPersonalizadas: datos.categorias.filter((categoria) => categoria.claveTraduccion === null),
    movimientos: datos.movimientos,
    presupuestos: datos.presupuestos,
    metas: metasConAportes,
  };

  await compartirArchivoTexto(JSON.stringify(paquete, null, 2), 'mipresupuesto-datos.json', 'application/json');
}
