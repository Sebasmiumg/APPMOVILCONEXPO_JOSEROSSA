import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

interface PropiedadesEntradaEscalonada {
  indice: number;
  children: React.ReactNode;
}

const RETRASO_POR_ITEM = 45;
const RETRASO_MAXIMO = 360;

export function EntradaEscalonada({ indice, children }: PropiedadesEntradaEscalonada) {
  const retraso = Math.min(indice * RETRASO_POR_ITEM, RETRASO_MAXIMO);

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(retraso).easing(Easing.out(Easing.cubic))}
    >
      {children}
    </Animated.View>
  );
}
