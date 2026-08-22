import { StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesTarjetaRecomendacion {
  titulo: string;
  descripcion: string;
  icono?: NombreIcono;
  tono?: 'positivo' | 'neutral' | 'atencion';
}

export function TarjetaRecomendacion({ titulo, descripcion, icono = 'lightbulb', tono = 'neutral' }: PropiedadesTarjetaRecomendacion) {
  const { tema } = useTema();
  const colorPorTono = {
    positivo: tema.colores.ingreso,
    neutral: tema.colores.violeta,
    atencion: tema.colores.advertencia,
  } as const;
  const color = colorPorTono[tono];

  return (
    <View
      style={[
        estilos.contenedor,
        { borderRadius: tema.radios.tarjeta, borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta },
      ]}
      accessible
      accessibilityLabel={`${titulo}. ${descripcion}`}
    >
      <View style={[estilos.icono, { backgroundColor: `${color}26` }]}>
        <Icono nombre={icono} tamano={18} color={color} />
      </View>
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{titulo}</Text>
        <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>{descripcion}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: 'flex-start',
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 4,
  },
  titulo: {
    fontSize: 14,
    fontFamily: FUENTES.negrita,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 18,
  },
});
