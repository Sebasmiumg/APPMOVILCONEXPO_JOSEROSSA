import {
  DOMINIOS_INSTITUCIONALES_CONOCIDOS,
  DOMINIOS_PERSONALES,
  SUFIJOS_INSTITUCIONALES,
} from '@/src/constantes/dominiosCorreo';
import type { ClasificacionCorreo } from '@/src/tipos/correo';

export function obtenerDominioCorreo(correo: string): string | null {
  const partes = correo.trim().toLowerCase().split('@');
  if (partes.length !== 2 || !partes[1]) {
    return null;
  }
  return partes[1];
}

export function clasificarCorreo(correo: string): ClasificacionCorreo | null {
  const dominio = obtenerDominioCorreo(correo);
  if (!dominio) {
    return null;
  }

  if (DOMINIOS_PERSONALES.includes(dominio)) {
    return { tipo: 'personal', dominio };
  }

  const esInstitucional =
    DOMINIOS_INSTITUCIONALES_CONOCIDOS.includes(dominio) ||
    SUFIJOS_INSTITUCIONALES.some((sufijo) => dominio.endsWith(sufijo));

  if (esInstitucional) {
    return { tipo: 'institucional', dominio };
  }

  return { tipo: 'organizacional', dominio };
}
