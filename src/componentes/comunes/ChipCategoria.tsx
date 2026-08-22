import { StyleSheet, Text } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { PressableAnimado } from '@/src/componentes/comunes/PressableAnimado';
import { useTema } from '@/src/contextos/ContextoTema';
import { useEscalaPresion } from '@/src/hooks/useEscalaPresion';

interface PropiedadesChipCategoria {
  etiqueta: string;
  icono?: NombreIcono;
  color?: string;
  seleccionado?: boolean;
  onPress?: () => void;
}

export function ChipCategoria({ etiqueta, icono, color, seleccionado = false, onPress }: PropiedadesChipCategoria) {
  const { tema } = useTema();
  const colorAcento = color ?? tema.colores.violeta;
  const { estiloAnimado, onPressIn, onPressOut } = useEscalaPresion(0.95);

  return (
    <PressableAnimado
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={etiqueta}
      accessibilityState={onPress ? { selected: seleccionado } : undefined}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={[
        estiloAnimado,
        estilos.contenedor,
        {
          borderRadius: tema.radios.chip,
          borderColor: seleccionado ? colorAcento : tema.colores.borde,
          backgroundColor: seleccionado ? `${colorAcento}26` : tema.colores.tarjeta,
        },
      ]}
    >
      {icono ? <Icono nombre={icono} tamano={16} color={colorAcento} /> : null}
      <Text
        style={[estilos.texto, { color: seleccionado ? colorAcento : tema.colores.textoPrincipal }]}
        numberOfLines={1}
      >
        {etiqueta}
      </Text>
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  texto: {
    fontSize: 13,
    fontFamily: FUENTES.seminegrita,
  },
});
