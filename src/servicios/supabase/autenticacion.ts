import { supabase } from '@/src/servicios/supabase/cliente';

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
    options: { data: { nombre } },
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
