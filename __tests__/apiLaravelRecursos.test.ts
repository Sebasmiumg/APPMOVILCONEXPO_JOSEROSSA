jest.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { listarCuentas, crearCuenta } from '@/src/servicios/laravelApi/cuentas';
import { listarCategoriasAPI, crearCategoriaAPI } from '@/src/servicios/laravelApi/categorias';
import { listarMetasAPI, crearMetaAPI } from '@/src/servicios/laravelApi/metas';
import { crearAporteMeta, listarAportesMeta } from '@/src/servicios/laravelApi/aportesMeta';
import {
  crearPresupuestoCategoriaAPI,
  listarPresupuestosCategoriaAPI,
} from '@/src/servicios/laravelApi/presupuestosCategoria';

describe('API de Laravel - recursos adicionales (cuentas, categorías, metas, presupuestos)', () => {
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

  it('lista cuentas', async () => {
    const cuentas = [{ id: 1, nombre: 'Efectivo', tipo: 'efectivo' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => cuentas });

    await expect(listarCuentas()).resolves.toEqual(cuentas);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/cuentas`, expect.any(Object));
  });

  it('crea una cuenta con POST', async () => {
    const datos = { nombre: 'Efectivo', tipo: 'efectivo' };
    const creada = { id: 1, ...datos };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => creada });

    await expect(crearCuenta(datos)).resolves.toEqual(creada);
    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/cuentas`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) })
    );
  });

  it('lista categorías', async () => {
    const categorias = [{ id: 1, tipo: 'gasto', nombre: 'Comida' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => categorias });

    await expect(listarCategoriasAPI()).resolves.toEqual(categorias);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/categorias`, expect.any(Object));
  });

  it('crea una categoría con POST', async () => {
    const datos = { tipo: 'gasto' as const, nombre: 'Comida', icono: 'restaurant', color: '#FF5733' };
    const creada = { id: 1, ...datos };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => creada });

    await expect(crearCategoriaAPI(datos)).resolves.toEqual(creada);
    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/categorias`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) })
    );
  });

  it('lista metas', async () => {
    const metas = [{ id: 1, nombre: 'Viaje', aportes: [] }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => metas });

    await expect(listarMetasAPI()).resolves.toEqual(metas);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/metas`, expect.any(Object));
  });

  it('crea una meta con POST', async () => {
    const datos = { nombre: 'Viaje', monto_objetivo: 3000 };
    const creada = { id: 1, ...datos };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => creada });

    await expect(crearMetaAPI(datos)).resolves.toEqual(creada);
    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/metas`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) })
    );
  });

  it('lista los aportes de una meta', async () => {
    const aportes = [{ id: 1, meta_id: 5, monto: '100.00' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => aportes });

    await expect(listarAportesMeta(5)).resolves.toEqual(aportes);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/metas/5/aportes`, expect.any(Object));
  });

  it('crea un aporte para una meta con POST', async () => {
    const datos = { monto: 200, fecha: '2026-09-20' };
    const creado = { id: 1, meta_id: 5, ...datos };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => creado });

    await expect(crearAporteMeta(5, datos)).resolves.toEqual(creado);
    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/metas/5/aportes`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) })
    );
  });

  it('lista presupuestos por categoría', async () => {
    const presupuestos = [{ id: 1, categoria_id: 2, periodo: '2026-09' }];
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => presupuestos });

    await expect(listarPresupuestosCategoriaAPI()).resolves.toEqual(presupuestos);
    expect(global.fetch).toHaveBeenCalledWith(`${URL_BASE}/presupuestos-categoria`, expect.any(Object));
  });

  it('crea un presupuesto por categoría con POST', async () => {
    const datos = { categoria_id: 2, periodo: '2026-09', limite: 800 };
    const creado = { id: 1, ...datos };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => creado });

    await expect(crearPresupuestoCategoriaAPI(datos)).resolves.toEqual(creado);
    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/presupuestos-categoria`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(datos) })
    );
  });
});
