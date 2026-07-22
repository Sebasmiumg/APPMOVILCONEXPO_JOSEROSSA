import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesTarjetaCristal {
  children: React.ReactNode;
  estilo?: ViewStyle;
  elevada?: boolean;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export function TarjetaCristal({ children, estilo, elevada = false, accessible, accessibilityLabel }: PropiedadesTarjetaCristal) {
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
      <BlurView
        intensity={30}
        tint="dark"
        style={[estilos.envoltorioBlur, { borderRadius: tema.radios.tarjeta }]}
      >
        {contenido}
      </BlurView>
    );
  }

  return contenido;
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
