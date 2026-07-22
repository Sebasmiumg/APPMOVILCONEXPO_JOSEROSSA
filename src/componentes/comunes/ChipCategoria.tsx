import { Pressable, StyleSheet, Text } from 'react-native';

import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';

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

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={etiqueta}
      accessibilityState={onPress ? { selected: seleccionado } : undefined}
      style={[
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
    </Pressable>
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
    fontWeight: '600',
  },
});
