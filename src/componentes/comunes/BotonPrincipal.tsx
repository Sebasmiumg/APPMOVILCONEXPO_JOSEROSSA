import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FUENTES } from '@/src/temas/tipografia';

import { useTema } from '@/src/contextos/ContextoTema';

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

interface PropiedadesBotonPrincipal {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
  cargando?: boolean;
  etiquetaAccesibilidad?: string;
}

export function BotonPrincipal({
  titulo,
  onPress,
  deshabilitado = false,
  cargando = false,
  etiquetaAccesibilidad,
}: PropiedadesBotonPrincipal) {
  const { tema } = useTema();
  const inactivo = deshabilitado || cargando;
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const manejarPress = () => {
    if (inactivo) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesibilidad ?? titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={[estiloAnimado, { opacity: inactivo ? 0.5 : 1 }]}
    >
      <LinearGradient
        colors={tema.gradientePrincipal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          estilos.contenedor,
          { borderRadius: tema.radios.boton, minHeight: tema.alturaControlMinima },
        ]}
      >
        {cargando ? (
          <ActivityIndicator color={tema.colores.sobrePrimario} />
        ) : (
          <Text style={[estilos.texto, { color: tema.colores.sobrePrimario }]} numberOfLines={2}>
            {titulo}
          </Text>
        )}
      </LinearGradient>
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  texto: {
    fontSize: 16,
    fontFamily: FUENTES.seminegrita,
    textAlign: 'center',
  },
});
