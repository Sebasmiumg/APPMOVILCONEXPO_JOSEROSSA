import { useWindowDimensions } from 'react-native';

export type PuntoQuiebre = 'movil' | 'tablet' | 'escritorio';

const ANCHO_TABLET = 768;
const ANCHO_ESCRITORIO = 1024;

export function useAnchoVentana(): { ancho: number; puntoQuiebre: PuntoQuiebre } {
  const { width } = useWindowDimensions();

  let puntoQuiebre: PuntoQuiebre = 'movil';
  if (width >= ANCHO_ESCRITORIO) {
    puntoQuiebre = 'escritorio';
  } else if (width >= ANCHO_TABLET) {
    puntoQuiebre = 'tablet';
  }

  return { ancho: width, puntoQuiebre };
}
