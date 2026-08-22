import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesTarjetaSaldo {
  etiqueta: string;
  saldo: string;
  variacion?: string;
  variacionPositiva?: boolean;
}

export function TarjetaSaldo({ etiqueta, saldo, variacion, variacionPositiva }: PropiedadesTarjetaSaldo) {
  const { tema } = useTema();

  const etiquetaAccesibilidad = [etiqueta, saldo, variacion].filter(Boolean).join('. ');

  return (
    <Animated.View
      entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))}
      style={{ borderRadius: tema.radios.tarjeta, overflow: 'hidden' }}
    >
      <LinearGradient
        colors={tema.gradientePrincipal}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.contenedor}
        accessible
        accessibilityLabel={etiquetaAccesibilidad}
      >
        <Text style={[estilos.etiqueta, { color: `${tema.colores.sobrePrimario}D9` }]}>{etiqueta}</Text>
        <Text
          style={[estilos.saldo, { color: tema.colores.sobrePrimario }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {saldo}
        </Text>
        {variacion ? (
          <View
            style={[
              estilos.chipVariacion,
              { backgroundColor: variacionPositiva === false ? 'rgba(255,92,122,0.25)' : 'rgba(32,217,151,0.25)' },
            ]}
          >
            <Text style={[estilos.textoVariacion, { color: tema.colores.sobrePrimario }]}>{variacion}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: 20,
    gap: 6,
  },
  etiqueta: {
    fontSize: 13,
    fontFamily: FUENTES.medio,
  },
  saldo: {
    fontSize: 32,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  chipVariacion: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  textoVariacion: {
    fontSize: 12,
    fontFamily: FUENTES.seminegrita,
  },
});
