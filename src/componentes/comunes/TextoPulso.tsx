import { useEffect } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface PropiedadesTextoPulso {
  children: string;
  style?: StyleProp<TextStyle>;
}

/** Texto con pulso de opacidad, para estados "en progreso" (ej. "escribiendo…"). */
export function TextoPulso({ children, style }: PropiedadesTextoPulso) {
  const opacidad = useSharedValue(1);

  useEffect(() => {
    opacidad.value = withRepeat(
      withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [opacidad]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: opacidad.value }));

  return (
    <Animated.Text style={[style, estiloAnimado]}>
      {children}
    </Animated.Text>
  );
}
