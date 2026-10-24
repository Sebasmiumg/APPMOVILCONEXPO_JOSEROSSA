jest.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import {
  actualizarMovimientoAPI,
  crearMovimientoAPI,
  eliminarMovimientoAPI,
  listarMovimientosAPI,
} from '@/src/servicios/laravelApi/movimientos';
import { obtenerReporteMovimientosPorMes } from '@/src/servicios/laravelApi/reportes';
import {
  crearPresupuestoCapacitacion,
  listarPresupuestosCapacitacion,
} from '@/src/servicios/laravelApi/presupuestosCapacitacion';

describe('API de Laravel (MiPresupuesto)', () => {
  const fetchOriginal = global.fetch;
  const URL_BASE = 'http://127.0.0.1:8000/api';

  beforeEach(() => {
    process.env.EXPO_PUBLIC_LARAVEL_API_URL = URL_BASE;
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    delete process.env.EXPO_PUBLIC_LARAVEL_API_URL;
    jest.restoreAllMocks();
  });

  it('lanza ErrorAPILaravel("sin_url") cuando falta la variable de entorno', async () => {
    delete process.env.EXPO_PUBLIC_LARAVEL_API_URL;

    await expect(listarMovimientosAPI()).rejects.toMatchObject({ codigo: 'sin_url' });
  });

  it('rechaza endpoints HTTP cuando la app está compilada para producción', async () => {
    process.env.NODE_ENV = 'production';
    process.env.EXPO_PUBLIC_LARAVEL_API_URL = 'http://api.ejemplo.com/api';
    global.fetch = jest.fn();

    await expect(listarMovimientosAPI()).rejects.toMatchObject({ codigo: 'sin_url' });
    expect(global.fetch).not.toHaveBeenCalled();
    process.env.NODE_ENV = 'test';
  });

  it('lista movimientos con GET a la URL configurada', async () => {
    const movimientos = [{ id: 1, descripcion: 'Venta', monto: '100.00', tipo: 'ingreso' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => movimientos });

    await expect(listarMovimientosAPI()).resolves.toEqual(movimientos);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/movimientos`, expect.objectContaining({ headers: expect.any(Object) }));
  });

  it('crea un movimiento con POST y el body serializado', async () => {
    const datos = { descripcion: 'Compra', monto: 50, tipo: 'gasto' as const, categoria: 'Comida', cuenta: 'Efectivo', fecha: '2026-09-01' };
    const creado = { id: 2, ...datos, monto: '50.00' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => creado });

    await expect(crearMovimientoAPI(datos)).resolves.toEqual(creado);
    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/movimientos`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) })
    );
  });

  it('actualiza un movimiento con PUT', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 3, monto: '400.00' }) });

    await actualizarMovimientoAPI(3, { monto: 400 });

    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/movimientos/3`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ monto: 400 }) })
    );
  });

  it('elimina un movimiento con DELETE y no intenta parsear el cuerpo (204)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('no debería llamarse'); } });

    await expect(eliminarMovimientoAPI(4)).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/movimientos/4`, expect.objectContaining({ method: 'DELETE' }));
  });

  it('lanza ErrorAPILaravel("no_encontrado") en un 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

    await expect(listarMovimientosAPI()).rejects.toBeInstanceOf(ErrorAPILaravel);
    await expect(listarMovimientosAPI()).rejects.toMatchObject({ codigo: 'no_encontrado' });
  });

  it('lanza ErrorAPILaravel("validacion") con los errores del backend en un 422', async () => {
    const errores = { descripcion: ['El campo descripcion es obligatorio.'] };
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ errors: errores }) });

    await expect(crearMovimientoAPI({} as never)).rejects.toMatchObject({ codigo: 'validacion', erroresValidacion: errores });
  });

  it('lanza ErrorAPILaravel("red") si fetch rechaza (sin conexión)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    await expect(listarMovimientosAPI()).rejects.toMatchObject({ codigo: 'red' });
  });

  it('obtiene el reporte mensual y agrega el query param de año cuando se indica', async () => {
    const reporte = [{ periodo: '2026-08', total_ingresos: 1000, total_gastos: 300, saldo_neto: 700, cantidad_movimientos: 2 }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => reporte });

    await expect(obtenerReporteMovimientosPorMes(2026)).resolves.toEqual(reporte);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/reportes/movimientos-por-mes?anio=2026`, expect.any(Object));
  });

  it('lista presupuestos de capacitación', async () => {
    const presupuestos = [{ id: 1, nombre: 'Curso de React Native', estado: 'planificada' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => presupuestos });

    await expect(listarPresupuestosCapacitacion()).resolves.toEqual(presupuestos);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/presupuestos-capacitacion`, expect.any(Object));
  });

  it('crea un presupuesto de capacitación con POST', async () => {
    const datos = { nombre: 'Curso de Laravel', monto_asignado: 800, fecha_inicio: '2026-10-01' };
    const creado = { id: 5, ...datos, estado: 'planificada' };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => creado });

    await expect(crearPresupuestoCapacitacion(datos)).resolves.toEqual(creado);
    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/presupuestos-capacitacion`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) })
    );
  });
});
