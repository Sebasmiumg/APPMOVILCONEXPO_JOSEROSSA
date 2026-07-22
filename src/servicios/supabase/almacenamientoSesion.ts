import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store limita cada valor a ~2048 bytes en iOS, y una sesión de
// Supabase (access_token + refresh_token) suele superarlo. Por eso el valor
// se divide en fragmentos antes de guardarlo. En Web, SecureStore no existe
// como almacenamiento nativo seguro, así que se usa AsyncStorage.
const TAMANO_FRAGMENTO = 1800;

async function establecerFragmentado(clave: string, valor: string): Promise<void> {
  const fragmentos: string[] = [];
  for (let i = 0; i < valor.length; i += TAMANO_FRAGMENTO) {
    fragmentos.push(valor.slice(i, i + TAMANO_FRAGMENTO));
  }
  await SecureStore.setItemAsync(`${clave}_n`, String(fragmentos.length));
  await Promise.all(fragmentos.map((fragmento, indice) => SecureStore.setItemAsync(`${clave}_${indice}`, fragmento)));
}

async function obtenerFragmentado(clave: string): Promise<string | null> {
  const total = await SecureStore.getItemAsync(`${clave}_n`);
  if (!total) return null;
  const indices = Array.from({ length: Number(total) }, (_, indice) => indice);
  const fragmentos = await Promise.all(indices.map((indice) => SecureStore.getItemAsync(`${clave}_${indice}`)));
  if (fragmentos.some((fragmento) => fragmento === null)) return null;
  return fragmentos.join('');
}

async function eliminarFragmentado(clave: string): Promise<void> {
  const total = await SecureStore.getItemAsync(`${clave}_n`);
  if (!total) return;
  const indices = Array.from({ length: Number(total) }, (_, indice) => indice);
  await Promise.all(indices.map((indice) => SecureStore.deleteItemAsync(`${clave}_${indice}`)));
  await SecureStore.deleteItemAsync(`${clave}_n`);
}

export const adaptadorAlmacenamientoSesion = {
  getItem: (clave: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(clave) : obtenerFragmentado(clave)),
  setItem: (clave: string, valor: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(clave, valor) : establecerFragmentado(clave, valor),
  removeItem: (clave: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(clave) : eliminarFragmentado(clave)),
};
