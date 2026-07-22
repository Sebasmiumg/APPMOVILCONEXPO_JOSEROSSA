import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { useTema } from '@/src/contextos/ContextoTema';

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

  const manejarPress = () => {
    if (deshabilitado) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress();
  };

  return (
    <Pressable
      onPress={manejarPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesibilidad ?? titulo}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [
        estilos.contenedor,
        {
          borderRadius: tema.radios.boton,
          minHeight: tema.alturaControlMinima,
          borderColor: tema.colores.borde,
          backgroundColor: tema.colores.tarjetaElevada,
          opacity: deshabilitado ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[estilos.texto, { color: tema.colores.textoPrincipal }]} numberOfLines={2}>
        {titulo}
      </Text>
    </Pressable>
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
    fontWeight: '600',
    textAlign: 'center',
  },
});
