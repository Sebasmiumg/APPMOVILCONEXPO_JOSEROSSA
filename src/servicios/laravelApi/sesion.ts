import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

export function obtenerTokenLaravel(): Promise<string | null> {
  return Platform.OS === 'web' ? AsyncStorage.getItem(CLAVE_TOKEN) : SecureStore.getItemAsync(CLAVE_TOKEN);
}

export function guardarTokenLaravel(token: string): Promise<void> {
  return Platform.OS === 'web'
    ? AsyncStorage.setItem(CLAVE_TOKEN, token)
    : SecureStore.setItemAsync(CLAVE_TOKEN, token);
}

export function borrarTokenLaravel(): Promise<void> {
  return Platform.OS === 'web' ? AsyncStorage.removeItem(CLAVE_TOKEN) : SecureStore.deleteItemAsync(CLAVE_TOKEN);
}
