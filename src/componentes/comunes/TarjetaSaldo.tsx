import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

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
    <LinearGradient
      colors={tema.gradientePrincipal}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[estilos.contenedor, { borderRadius: tema.radios.tarjeta }]}
      accessible
      accessibilityLabel={etiquetaAccesibilidad}
    >
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <Text style={estilos.saldo} numberOfLines={1} adjustsFontSizeToFit>
        {saldo}
      </Text>
      {variacion ? (
        <View
          style={[
            estilos.chipVariacion,
            { backgroundColor: variacionPositiva === false ? 'rgba(255,92,122,0.25)' : 'rgba(32,217,151,0.25)' },
          ]}
        >
          <Text style={estilos.textoVariacion}>{variacion}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: 20,
    gap: 6,
  },
  etiqueta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  saldo: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  chipVariacion: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  textoVariacion: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
