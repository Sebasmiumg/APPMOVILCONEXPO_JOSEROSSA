import { supabase } from '@/src/servicios/supabase/cliente';
import { Platform } from 'react-native';

function urlDeVerificacion(correo: string): string | undefined {
  const ruta = `/autenticacion/verificar-correo?correo=${encodeURIComponent(correo)}`;

  // En producción y en el navegador local, Supabase debe devolver al usuario
  // a la pantalla que explica el siguiente paso después de confirmar el email.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URL(ruta, window.location.origin).toString();
  }

  // La confirmación también se puede abrir desde el navegador del teléfono;
  // después, el usuario puede iniciar sesión en la app nativa.
  return new URL(ruta, 'https://www.mipresupuestoapp.com').toString();
}

export interface ResultadoAutenticacion {
  error: string | null;
}

function requerirCliente() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa EXPO_PUBLIC_SUPABASE_URL en tu .env');
  }
  return supabase;
}

export async function registrarUsuario(nombre: string, correo: string, contrasena: string): Promise<ResultadoAutenticacion> {
  const cliente = requerirCliente();
  const { error } = await cliente.auth.signUp({
    email: correo,
    password: contrasena,
    options: {
      data: { nombre },
      emailRedirectTo: urlDeVerificacion(correo),
    },
  });
  return { error: error?.message ?? null };
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<ResultadoAutenticacion> {
  const cliente = requerirCliente();
  const { error } = await cliente.auth.signInWithPassword({ email: correo, password: contrasena });
  return { error: error?.message ?? null };
}

export async function cerrarSesionSupabase(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function recuperarContrasena(correo: string): Promise<ResultadoAutenticacion> {
  const cliente = requerirCliente();
  const { error } = await cliente.auth.resetPasswordForEmail(correo);
  return { error: error?.message ?? null };
}

export async function reenviarVerificacion(correo: string): Promise<ResultadoAutenticacion> {
  const cliente = requerirCliente();
  const { error } = await cliente.auth.resend({ type: 'signup', email: correo });
  return { error: error?.message ?? null };
}
