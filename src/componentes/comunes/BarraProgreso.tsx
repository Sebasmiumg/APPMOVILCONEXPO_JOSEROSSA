import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesBarraProgreso {
  progreso: number;
  color?: string;
  etiquetaAccesibilidad?: string;
}

export function BarraProgreso({ progreso, color, etiquetaAccesibilidad }: PropiedadesBarraProgreso) {
  const { tema } = useTema();
  const porcentaje = Math.max(0, Math.min(1, progreso));
  const anchoAnimado = useSharedValue(0);

  useEffect(() => {
    anchoAnimado.value = withTiming(porcentaje * 100, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [porcentaje, anchoAnimado]);

  const estiloRelleno = useAnimatedStyle(() => ({
    width: `${anchoAnimado.value}%`,
  }));

  return (
    <View
      style={[estilos.pista, { backgroundColor: tema.colores.borde }]}
      accessibilityRole="progressbar"
      accessibilityLabel={etiquetaAccesibilidad}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(porcentaje * 100) }}
    >
      <Animated.View
        style={[estilos.relleno, estiloRelleno, { backgroundColor: color ?? tema.colores.violeta }]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pista: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: 999,
  },
});
