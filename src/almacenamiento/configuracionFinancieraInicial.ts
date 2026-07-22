import {
  eliminarPreferencia,
  guardarPreferencia,
  obtenerPreferencia,
} from '@/src/almacenamiento/preferenciasDispositivo';
import { CLAVES_ALMACENAMIENTO } from '@/src/constantes/almacenamiento';
import type { ConfiguracionFinancieraInicial } from '@/src/tipos/finanzas';

export async function guardarConfiguracionFinancieraInicial(
  configuracion: ConfiguracionFinancieraInicial
): Promise<void> {
  await guardarPreferencia(
    CLAVES_ALMACENAMIENTO.configuracionFinancieraInicial,
    JSON.stringify(configuracion)
  );
  await guardarPreferencia(CLAVES_ALMACENAMIENTO.configuracionInicialCompleta, 'true');
}

export async function obtenerConfiguracionFinancieraInicial(): Promise<ConfiguracionFinancieraInicial | null> {
  const crudo = await obtenerPreferencia(CLAVES_ALMACENAMIENTO.configuracionFinancieraInicial);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as ConfiguracionFinancieraInicial;
  } catch {
    return null;
  }
}

export async function configuracionInicialEstaCompleta(): Promise<boolean> {
  const valor = await obtenerPreferencia(CLAVES_ALMACENAMIENTO.configuracionInicialCompleta);
  return valor === 'true';
}

export async function restablecerConfiguracionInicial(): Promise<void> {
  await eliminarPreferencia(CLAVES_ALMACENAMIENTO.configuracionFinancieraInicial);
  await eliminarPreferencia(CLAVES_ALMACENAMIENTO.configuracionInicialCompleta);
}
