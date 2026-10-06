jest.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

import { cerrarSesionLaravel, iniciarSesionLaravel } from '@/src/servicios/laravelApi/autenticacion';
import { ErrorAPILaravel, obtenerLaravel } from '@/src/servicios/laravelApi/cliente';
import { alExpirarSesionLaravel } from '@/src/servicios/laravelApi/sesion';

describe('Sesión y autenticación de la API de Laravel', () => {
  const fetchOriginal = global.fetch;
  const URL_BASE = 'http://127.0.0.1:8000/api';

  beforeEach(() => {
    process.env.EXPO_PUBLIC_LARAVEL_API_URL = URL_BASE;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    delete process.env.EXPO_PUBLIC_LARAVEL_API_URL;
  });

  it('guarda el token tras iniciar sesión y lo envía como Bearer en la siguiente petición', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ usuario: { id: 1, name: 'Ana', email: 'ana@example.com' }, token: 'abc123' }),
    });

    await iniciarSesionLaravel('ana@example.com', 'password');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('laravel_api_token', 'abc123');

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('abc123');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });

    await obtenerLaravel('/cuentas');

    expect(global.fetch).toHaveBeenCalledWith(
      `${URL_BASE}/cuentas`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer abc123' }) })
    );
  });

  it('lanza ErrorAPILaravel("no_autorizado") y borra el token cuando la API responde 401', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('token-vencido');
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    const oyente = jest.fn();
    const dejarDeEscuchar = alExpirarSesionLaravel(oyente);

    await expect(obtenerLaravel('/cuentas')).rejects.toMatchObject({ codigo: 'no_autorizado' });

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('laravel_api_token');
    expect(oyente).toHaveBeenCalled();
    dejarDeEscuchar();
  });

  it('cerrarSesionLaravel borra el token aunque la petición de logout falle', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('abc123');
    global.fetch = jest.fn().mockRejectedValue(new Error('sin red'));

    await expect(cerrarSesionLaravel()).rejects.toBeInstanceOf(ErrorAPILaravel);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('laravel_api_token');
  });
});
