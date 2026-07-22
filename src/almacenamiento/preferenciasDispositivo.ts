import AsyncStorage from '@react-native-async-storage/async-storage';

export async function obtenerPreferencia(clave: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(clave);
  } catch {
    return null;
  }
}

export async function guardarPreferencia(clave: string, valor: string): Promise<void> {
  try {
    await AsyncStorage.setItem(clave, valor);
  } catch {
    // El dispositivo no permite persistir; la preferencia queda solo en memoria.
  }
}

export async function eliminarPreferencia(clave: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(clave);
  } catch {
    // Ignorado: no hay nada que limpiar si el almacenamiento falló.
  }
}
