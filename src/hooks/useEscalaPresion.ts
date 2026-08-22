import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/** Feedback táctil consistente: reduce ligeramente la escala al presionar, restaura al soltar. */
export function useEscalaPresion(valorPresionado = 0.97) {
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const onPressIn = () => {
    escala.value = withTiming(valorPresionado, { duration: 120 });
  };

  const onPressOut = () => {
    escala.value = withTiming(1, { duration: 200 });
  };

  return { estiloAnimado, onPressIn, onPressOut };
}
