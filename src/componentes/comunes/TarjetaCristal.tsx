import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesTarjetaCristal {
  children: React.ReactNode;
  estilo?: ViewStyle;
  elevada?: boolean;
  accessible?: boolean;
  accessibilityLabel?: string;
  retrasoEntrada?: number;
}

const ENTRADA_BASE = FadeInDown.duration(420).easing(Easing.out(Easing.cubic));

export function TarjetaCristal({
  children,
  estilo,
  elevada = false,
  accessible,
  accessibilityLabel,
  retrasoEntrada = 0,
}: PropiedadesTarjetaCristal) {
  const { tema } = useTema();
  const colorFondo = elevada ? tema.colores.tarjetaElevada : tema.colores.tarjeta;

  const contenido = (
    <View
      style={[
        estilos.contenedor,
        {
          borderRadius: tema.radios.tarjeta,
          borderColor: tema.colores.borde,
          backgroundColor: tema.modo === 'oscuro' ? `${colorFondo}CC` : colorFondo,
        },
        estilo,
      ]}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );

  if (tema.modo === 'oscuro' && Platform.OS !== 'web') {
    return (
      <Animated.View
        entering={ENTRADA_BASE.delay(retrasoEntrada)}
        style={[estilos.envoltorioBlur, { borderRadius: tema.radios.tarjeta }]}
      >
        <BlurView intensity={30} tint="dark">
          {contenido}
        </BlurView>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={ENTRADA_BASE.delay(retrasoEntrada)}>
      {contenido}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  envoltorioBlur: {
    overflow: 'hidden',
  },
  contenedor: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
});
