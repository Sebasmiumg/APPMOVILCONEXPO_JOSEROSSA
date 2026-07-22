import { paletaClara, paletaOscura, GRADIENTE_AURORA } from '@/src/temas/colores';
import type { ModoTema, Tema } from '@/src/tipos/tema';

export function crearTema(modo: ModoTema): Tema {
  return {
    modo,
    colores: modo === 'oscuro' ? paletaOscura : paletaClara,
    gradientePrincipal: GRADIENTE_AURORA,
    radios: {
      tarjeta: 20,
      boton: 16,
      chip: 999,
    },
    espaciado: (multiplo: number) => multiplo * 4,
    alturaControlMinima: 44,
  };
}

export const temaOscuro = crearTema('oscuro');
export const temaClaro = crearTema('claro');
