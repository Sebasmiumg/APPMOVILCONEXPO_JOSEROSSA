import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { supabase } from '@/src/servicios/supabase/cliente';

const CLAVE_TOKEN = 'laravel_api_token';

type OyenteSesionExpirada = () => void;
const oyentesSesionExpirada = new Set<OyenteSesionExpirada>();

export function alExpirarSesionLaravel(oyente: OyenteSesionExpirada): () => void {
  oyentesSesionExpirada.add(oyente);
  return () => oyentesSesionExpirada.delete(oyente);
}

export function notificarSesionLaravelExpirada(): void {
  oyentesSesionExpirada.forEach((oyente) => oyente());
}

export async function obtenerTokenLaravel(): Promise<string | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  }

  return Platform.OS === 'web' ? obtenerTokenWeb() : SecureStore.getItemAsync(CLAVE_TOKEN);
}

export function guardarTokenLaravel(token: string): Promise<void> {
  return Platform.OS === 'web'
    ? guardarTokenWeb(token)
    : SecureStore.setItemAsync(CLAVE_TOKEN, token);
}

export function borrarTokenLaravel(): Promise<void> {
  return Platform.OS === 'web' ? borrarTokenWeb() : SecureStore.deleteItemAsync(CLAVE_TOKEN);
}

async function obtenerTokenWeb(): Promise<string | null> {
  return almacenamientoWebSeguro()?.getItem(CLAVE_TOKEN) ?? null;
}

async function guardarTokenWeb(token: string): Promise<void> {
  const almacenamiento = almacenamientoWebSeguro();
  if (!almacenamiento) throw new Error('El almacenamiento seguro de sesión no está disponible.');
  almacenamiento.setItem(CLAVE_TOKEN, token);
}

async function borrarTokenWeb(): Promise<void> {
  almacenamientoWebSeguro()?.removeItem(CLAVE_TOKEN);
}

function almacenamientoWebSeguro(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
