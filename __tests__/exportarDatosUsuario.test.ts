import type { Categoria } from '@/src/tipos/categoria';
import type { Cuenta } from '@/src/tipos/cuenta';
import type { Meta, AporteMeta } from '@/src/tipos/meta';
import type { Movimiento } from '@/src/tipos/movimiento';

const mockCompartirArchivoTexto = jest.fn().mockResolvedValue(undefined);
jest.mock('@/src/servicios/reportes/exportarReporte', () => ({
  compartirArchivoTexto: (...args: unknown[]) => mockCompartirArchivoTexto(...args),
}));

import { exportarDatosUsuario, type DatosExportables } from '@/src/servicios/exportacion/exportarDatosUsuario';

function crearCuenta(parciales: Partial<Cuenta> = {}): Cuenta {
  return {
    id: 'cuenta-1',
    nombre: 'Principal',
    tipo: 'efectivo',
    moneda: 'GTQ',
    saldoInicial: 0,
    color: null,
    icono: null,
    activa: true,
    creadaEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...parciales,
  };
}

function crearCategoria(parciales: Partial<Categoria> = {}): Categoria {
  return {
    id: 'cat-1',
    tipo: 'gasto',
    claveTraduccion: 'alimentacion',
    nombrePersonalizado: null,
    icono: 'restaurant',
    color: '#FF0000',
    activa: true,
    ...parciales,
  };
}

function crearMovimiento(parciales: Partial<Movimiento> = {}): Movimiento {
  return {
    id: 'mov-1',
    cuentaId: 'cuenta-1',
    cuentaDestinoId: null,
    movimientoRelacionadoId: null,
    tipo: 'gasto',
    monto: 100,
    categoriaId: 'cat-1',
    descripcion: null,
    notas: null,
    fechaMovimiento: '2026-07-01T00:00:00.000Z',
    comprobanteUrl: null,
    recurrente: false,
    creadoEn: '2026-07-01T00:00:00.000Z',
    actualizadoEn: '2026-07-01T00:00:00.000Z',
    ...parciales,
  };
}

function crearMeta(parciales: Partial<Meta> = {}): Meta {
  return {
    id: 'meta-1',
    cuentaId: null,
    nombre: 'Vacaciones',
    montoObjetivo: 4000,
    montoActual: 0,
    fechaObjetivo: null,
    estado: 'activa',
    creadaEn: '2026-01-01T00:00:00.000Z',
    ...parciales,
  };
}

function crearAporte(parciales: Partial<AporteMeta> = {}): AporteMeta {
  return { id: 'aporte-1', metaId: 'meta-1', monto: 200, fecha: '2026-07-01T00:00:00.000Z', nota: null, ...parciales };
}

beforeEach(() => {
  mockCompartirArchivoTexto.mockClear();
});

describe('exportarDatosUsuario', () => {
  it('excluye categorías predefinidas y solo incluye las personalizadas', async () => {
    const predefinida = crearCategoria({ id: 'cat-predefinida', claveTraduccion: 'alimentacion' });
    const personalizada = crearCategoria({ id: 'cat-personalizada', claveTraduccion: null, nombrePersonalizado: 'Mascotas' });

    await exportarDatosUsuario({
      cuentas: [crearCuenta()],
      categorias: [predefinida, personalizada],
      movimientos: [],
      presupuestos: [],
      metas: [],
      obtenerAportesMeta: async () => [],
    });

    expect(mockCompartirArchivoTexto).toHaveBeenCalledTimes(1);
    const [contenido, nombreArchivo, tipoMime] = mockCompartirArchivoTexto.mock.calls[0];
    const paquete: DatosExportables = JSON.parse(contenido);

    expect(paquete.categoriasPersonalizadas).toHaveLength(1);
    expect(paquete.categoriasPersonalizadas[0].id).toBe('cat-personalizada');
    expect(nombreArchivo).toBe('mipresupuesto-datos.json');
    expect(tipoMime).toBe('application/json');
  });

  it('adjunta los aportes correspondientes a cada meta', async () => {
    const metaConAportes = crearMeta({ id: 'meta-1' });
    const metaSinAportes = crearMeta({ id: 'meta-2', nombre: 'Emergencia' });
    const aportes = [crearAporte({ id: 'aporte-1', metaId: 'meta-1' }), crearAporte({ id: 'aporte-2', metaId: 'meta-1' })];

    await exportarDatosUsuario({
      cuentas: [crearCuenta()],
      categorias: [],
      movimientos: [crearMovimiento()],
      presupuestos: [],
      metas: [metaConAportes, metaSinAportes],
      obtenerAportesMeta: async (metaId) => aportes.filter((aporte) => aporte.metaId === metaId),
    });

    const [contenido] = mockCompartirArchivoTexto.mock.calls[0];
    const paquete: DatosExportables = JSON.parse(contenido);

    const exportadaConAportes = paquete.metas.find((m) => m.id === 'meta-1');
    const exportadaSinAportes = paquete.metas.find((m) => m.id === 'meta-2');
    expect(exportadaConAportes?.aportes).toHaveLength(2);
    expect(exportadaSinAportes?.aportes).toHaveLength(0);
    expect(paquete.movimientos).toHaveLength(1);
    expect(paquete.generadoEn).toEqual(expect.any(String));
  });
});
