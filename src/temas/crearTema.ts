import { paletaClara, paletaOscura, GRADIENTE_ORO } from '@/src/temas/colores';
import type { ModoTema, Tema } from '@/src/tipos/tema';

export function crearTema(modo: ModoTema): Tema {
  return {
    modo,
    colores: modo === 'oscuro' ? paletaOscura : paletaClara,
    gradientePrincipal: GRADIENTE_ORO,
    radios: {
      tarjeta: 6,
      boton: 4,
      chip: 4,
    },
    espaciado: (multiplo: number) => multiplo * 4,
    alturaControlMinima: 44,
  };
}

export const temaOscuro = crearTema('oscuro');
export const temaClaro = crearTema('claro');
