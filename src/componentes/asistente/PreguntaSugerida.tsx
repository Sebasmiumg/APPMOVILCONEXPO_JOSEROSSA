import { Pressable, StyleSheet, Text } from 'react-native';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesPreguntaSugerida {
  texto: string;
  onPress: () => void;
}

export function PreguntaSugerida({ texto, onPress }: PropiedadesPreguntaSugerida) {
  const { tema } = useTema();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={[
        estilos.contenedor,
        { borderRadius: tema.radios.chip, borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta },
      ]}
    >
      <Text style={{ color: tema.colores.textoPrincipal, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
        {texto}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
});
