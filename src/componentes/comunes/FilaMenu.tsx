import { StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { PressableAnimado } from '@/src/componentes/comunes/PressableAnimado';
import { useTema } from '@/src/contextos/ContextoTema';
import { useEscalaPresion } from '@/src/hooks/useEscalaPresion';

interface PropiedadesFilaMenu {
  titulo: string;
  icono: NombreIcono;
  onPress: () => void;
}

export function FilaMenu({ titulo, icono, onPress }: PropiedadesFilaMenu) {
  const { tema } = useTema();
  const { estiloAnimado, onPressIn, onPressOut } = useEscalaPresion();

  return (
    <PressableAnimado
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      style={[
        estiloAnimado,
        estilos.contenedor,
        { borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta },
      ]}
    >
      <Icono nombre={icono} tamano={20} color={tema.colores.violeta} />
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
          {titulo}
        </Text>
      </View>
      <Icono nombre="chevron-right" tamano={18} color={tema.colores.textoSecundario} />
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  textos: {
    flex: 1,
  },
  titulo: {
    fontSize: 14,
    fontFamily: FUENTES.seminegrita,
  },
});
