import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { guardarPreferencia, obtenerPreferencia } from '@/src/almacenamiento/preferenciasDispositivo';
import { CLAVES_ALMACENAMIENTO } from '@/src/constantes/almacenamiento';

// expo-local-authentication no está disponible en web (ver AGENTS.md: SDK 54); ahí esta
// función siempre reporta "no disponible", igual que el resto de funciones nativas
// opcionales de la app (mismo patrón de degradación elegante usado con Supabase).
export async function bloqueoBiometricoDisponible(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const [tieneHardware, tieneEnrolados] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return tieneHardware && tieneEnrolados;
}

export async function bloqueoBiometricoActivado(): Promise<boolean> {
  const valor = await obtenerPreferencia(CLAVES_ALMACENAMIENTO.bloqueoBiometricoActivado);
  return valor === 'true';
}

export async function establecerBloqueoBiometrico(activado: boolean): Promise<void> {
  await guardarPreferencia(CLAVES_ALMACENAMIENTO.bloqueoBiometricoActivado, activado ? 'true' : 'false');
}

export async function autenticarConBiometria(mensaje: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: mensaje,
    disableDeviceFallback: false,
  });
  return resultado.success;
}
