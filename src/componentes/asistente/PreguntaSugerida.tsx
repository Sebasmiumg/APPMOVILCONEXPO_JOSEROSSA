import { StyleSheet, Text } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { PressableAnimado } from '@/src/componentes/comunes/PressableAnimado';
import { useTema } from '@/src/contextos/ContextoTema';
import { useEscalaPresion } from '@/src/hooks/useEscalaPresion';

interface PropiedadesPreguntaSugerida {
  texto: string;
  onPress: () => void;
}

export function PreguntaSugerida({ texto, onPress }: PropiedadesPreguntaSugerida) {
  const { tema } = useTema();
  const { estiloAnimado, onPressIn, onPressOut } = useEscalaPresion();

  return (
    <PressableAnimado
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={texto}
      style={[
        estiloAnimado,
        estilos.contenedor,
        { borderRadius: tema.radios.chip, borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta },
      ]}
    >
      <Text style={{ color: tema.colores.textoPrincipal, fontSize: 13, fontFamily: FUENTES.seminegrita }} numberOfLines={1}>
        {texto}
      </Text>
    </PressableAnimado>
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
