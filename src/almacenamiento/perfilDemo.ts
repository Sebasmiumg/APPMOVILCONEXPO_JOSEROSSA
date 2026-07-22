import { restablecerConfiguracionInicial } from '@/src/almacenamiento/configuracionFinancieraInicial';
import {
  eliminarPreferencia,
  guardarPreferencia,
  obtenerPreferencia,
} from '@/src/almacenamiento/preferenciasDispositivo';
import { CLAVES_ALMACENAMIENTO } from '@/src/constantes/almacenamiento';

export interface PerfilDemo {
  nombre: string | null;
  correo: string | null;
}

export async function obtenerPerfilDemo(): Promise<PerfilDemo> {
  const [nombre, correo] = await Promise.all([
    obtenerPreferencia(CLAVES_ALMACENAMIENTO.nombreUsuarioDemo),
    obtenerPreferencia(CLAVES_ALMACENAMIENTO.correoUsuarioDemo),
  ]);
  return { nombre, correo };
}

export async function guardarNombrePerfilDemo(nombre: string): Promise<void> {
  await guardarPreferencia(CLAVES_ALMACENAMIENTO.nombreUsuarioDemo, nombre);
}

// Usado por "cerrar sesión" y "eliminar cuenta" en la Fase 1: como todavía no existe
// backend (llega en la Fase 5), ambas acciones limpian los datos locales de demostración.
export async function borrarDatosLocalesDemo(): Promise<void> {
  await Promise.all([
    eliminarPreferencia(CLAVES_ALMACENAMIENTO.nombreUsuarioDemo),
    eliminarPreferencia(CLAVES_ALMACENAMIENTO.correoUsuarioDemo),
    restablecerConfiguracionInicial(),
  ]);
}
