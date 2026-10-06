import { borrarTokenLaravel, notificarSesionLaravelExpirada, obtenerTokenLaravel } from '@/src/servicios/laravelApi/sesion';

export class ErrorAPILaravel extends Error {
  constructor(
    public readonly codigo: 'sin_url' | 'red' | 'validacion' | 'no_encontrado' | 'no_autorizado' | 'respuesta',
    public readonly erroresValidacion?: Record<string, string[]>
  ) {
    super(codigo);
    this.name = 'ErrorAPILaravel';
  }
}

function obtenerURLBase(): string {
  const url = process.env.EXPO_PUBLIC_LARAVEL_API_URL?.trim();
  if (!url) throw new ErrorAPILaravel('sin_url');
  return url.replace(/\/+$/, '');
}

async function solicitarLaravel<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const urlCompleta = `${obtenerURLBase()}${ruta}`;
  const token = await obtenerTokenLaravel();

  let respuesta: Response;
  try {
    respuesta = await fetch(urlCompleta, {
      ...opciones,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opciones.headers,
      },
    });
  } catch {
    throw new ErrorAPILaravel('red');
  }

  if (respuesta.status === 401) {
    await borrarTokenLaravel();
    notificarSesionLaravelExpirada();
    throw new ErrorAPILaravel('no_autorizado');
  }
  if (respuesta.status === 404) throw new ErrorAPILaravel('no_encontrado');
  if (respuesta.status === 422) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new ErrorAPILaravel('validacion', cuerpo?.errors);
  }
  if (!respuesta.ok) throw new ErrorAPILaravel('respuesta');
  if (respuesta.status === 204) return undefined as T;

  return respuesta.json() as Promise<T>;
}

export function obtenerLaravel<T>(ruta: string): Promise<T> {
  return solicitarLaravel<T>(ruta);
}

export function postLaravel<T>(ruta: string, datos: unknown): Promise<T> {
  return solicitarLaravel<T>(ruta, { method: 'POST', body: JSON.stringify(datos) });
}

export function putLaravel<T>(ruta: string, datos: unknown): Promise<T> {
  return solicitarLaravel<T>(ruta, { method: 'PUT', body: JSON.stringify(datos) });
}

export function eliminarLaravel(ruta: string): Promise<void> {
  return solicitarLaravel<void>(ruta, { method: 'DELETE' });
}
