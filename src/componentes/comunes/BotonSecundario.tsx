import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FUENTES } from '@/src/temas/tipografia';

import { useTema } from '@/src/contextos/ContextoTema';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

interface PropiedadesBotonSecundario {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
  etiquetaAccesibilidad?: string;
}

export function BotonSecundario({
  titulo,
  onPress,
  deshabilitado = false,
  etiquetaAccesibilidad,
}: PropiedadesBotonSecundario) {
  const { tema } = useTema();
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const manejarPress = () => {
    if (deshabilitado) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <PressableAnimado
      onPress={manejarPress}
      onPressIn={() => {
        escala.value = withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        escala.value = withTiming(1, { duration: 200 });
      }}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesibilidad ?? titulo}
      accessibilityState={{ disabled: deshabilitado }}
      style={[
        estiloAnimado,
        estilos.contenedor,
        {
          borderRadius: tema.radios.boton,
          minHeight: tema.alturaControlMinima,
          borderColor: tema.colores.borde,
          backgroundColor: tema.colores.tarjetaElevada,
          opacity: deshabilitado ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[estilos.texto, { color: tema.colores.textoPrincipal }]} numberOfLines={2}>
        {titulo}
      </Text>
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  texto: {
    fontSize: 16,
    fontFamily: FUENTES.seminegrita,
    textAlign: 'center',
  },
});
