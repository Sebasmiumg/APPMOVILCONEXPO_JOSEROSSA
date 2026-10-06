import { postLaravel } from '@/src/servicios/laravelApi/cliente';
import { borrarTokenLaravel, guardarTokenLaravel, obtenerTokenLaravel } from '@/src/servicios/laravelApi/sesion';
import type { RespuestaLoginAPI, UsuarioAPI } from '@/src/tipos/laravelApi';

export async function iniciarSesionLaravel(email: string, password: string): Promise<UsuarioAPI> {
  const datos = await postLaravel<RespuestaLoginAPI>('/login', { email, password });
  await guardarTokenLaravel(datos.token);
  return datos.usuario;
}

export async function cerrarSesionLaravel(): Promise<void> {
  try {
    await postLaravel('/logout', {});
  } finally {
    await borrarTokenLaravel();
  }
}

export async function haySesionLaravelActiva(): Promise<boolean> {
  return (await obtenerTokenLaravel()) !== null;
}
