import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesIndicadorPasos {
  totalPasos: number;
  pasoActual: number;
}

export function IndicadorPasos({ totalPasos, pasoActual }: PropiedadesIndicadorPasos) {
  const { tema } = useTema();

  return (
    <View style={estilos.fila} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: totalPasos, now: pasoActual }}>
      {Array.from({ length: totalPasos }).map((_, indice) => (
        <PuntoIndicador
          key={indice}
          activo={indice <= pasoActual - 1}
          colorActivo={tema.colores.violeta}
          colorInactivo={tema.colores.borde}
        />
      ))}
    </View>
  );
}

interface PropiedadesPuntoIndicador {
  activo: boolean;
  colorActivo: string;
  colorInactivo: string;
}

function PuntoIndicador({ activo, colorActivo, colorInactivo }: PropiedadesPuntoIndicador) {
  const progreso = useSharedValue(activo ? 1 : 0);

  useEffect(() => {
    progreso.value = withTiming(activo ? 1 : 0, { duration: 250 });
  }, [activo, progreso]);

  const estiloAnimado = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progreso.value, [0, 1], [colorInactivo, colorActivo]),
  }));

  return <Animated.View style={[estilos.punto, estiloAnimado]} />;
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 6,
  },
  punto: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
});
