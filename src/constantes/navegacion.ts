import type { NombreIcono } from '@/src/componentes/comunes/Icono';

export interface DestinoNavegacion {
  clave: 'inicio' | 'movimientos' | 'asistente' | 'analisis' | 'metas' | 'reinversion' | 'perfil';
  ruta: string;
  icono: NombreIcono;
  claveTraduccion: string;
  enDockMovil: boolean;
}

export const DESTINOS_NAVEGACION: readonly DestinoNavegacion[] = [
  { clave: 'inicio', ruta: 'inicio', icono: 'home', claveTraduccion: 'navegacion.inicio', enDockMovil: true },
  {
    clave: 'movimientos',
    ruta: 'movimientos',
    icono: 'receipt-long',
    claveTraduccion: 'navegacion.movimientos',
    enDockMovil: true,
  },
  {
    clave: 'asistente',
    ruta: 'asistente',
    icono: 'chat-bubble',
    claveTraduccion: 'navegacion.asistente',
    enDockMovil: true,
  },
  {
    clave: 'analisis',
    ruta: 'analisis',
    icono: 'insights',
    claveTraduccion: 'navegacion.analisis',
    enDockMovil: false,
  },
  {
    clave: 'metas',
    ruta: 'metas',
    icono: 'flag',
    claveTraduccion: 'navegacion.metas',
    enDockMovil: false,
  },
  {
    clave: 'reinversion',
    ruta: 'reinversion',
    icono: 'trending-up',
    claveTraduccion: 'navegacion.reinversion',
    enDockMovil: false,
  },
  { clave: 'perfil', ruta: 'perfil', icono: 'person', claveTraduccion: 'navegacion.perfil', enDockMovil: true },
] as const;
