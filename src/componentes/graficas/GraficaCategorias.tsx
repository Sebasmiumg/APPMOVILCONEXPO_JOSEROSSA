import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { FUENTES } from '@/src/temas/tipografia';

import { useTema } from '@/src/contextos/ContextoTema';

export interface SegmentoGraficaCategorias {
  id: string;
  etiqueta: string;
  porcentaje: number;
  color: string;
}

interface PropiedadesGraficaCategorias {
  segmentos: SegmentoGraficaCategorias[];
  etiquetaCentral?: string;
}

const RADIO = 60;
const GROSOR = 20;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const TAMANO_SVG = (RADIO + GROSOR) * 2;

export function GraficaCategorias({ segmentos, etiquetaCentral }: PropiedadesGraficaCategorias) {
  const { tema } = useTema();
  let acumulado = 0;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={estilos.contenedor}>
      <View style={estilos.envoltorioDona}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={TAMANO_SVG} height={TAMANO_SVG}>
          <G transform={`rotate(-90 ${TAMANO_SVG / 2} ${TAMANO_SVG / 2})`}>
            <Circle
              cx={TAMANO_SVG / 2}
              cy={TAMANO_SVG / 2}
              r={RADIO}
              stroke={tema.colores.borde}
              strokeWidth={GROSOR}
              fill="none"
            />
            {segmentos.map((segmento) => {
              const largo = (segmento.porcentaje / 100) * CIRCUNFERENCIA;
              const dashoffset = -((acumulado / 100) * CIRCUNFERENCIA);
              acumulado += segmento.porcentaje;
              return (
                <Circle
                  key={segmento.id}
                  cx={TAMANO_SVG / 2}
                  cy={TAMANO_SVG / 2}
                  r={RADIO}
                  stroke={segmento.color}
                  strokeWidth={GROSOR}
                  strokeDasharray={`${largo} ${CIRCUNFERENCIA - largo}`}
                  strokeDashoffset={dashoffset}
                  fill="none"
                  strokeLinecap="butt"
                />
              );
            })}
          </G>
        </Svg>
        </View>
        {etiquetaCentral ? (
          <View style={estilos.centro} pointerEvents="none">
            <Text style={[estilos.textoCentro, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {etiquetaCentral}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={estilos.leyenda}>
        {segmentos.map((segmento) => (
          <View key={segmento.id} style={estilos.filaLeyenda}>
            <View style={[estilos.punto, { backgroundColor: segmento.color }]} />
            <Text style={[estilos.textoLeyenda, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {segmento.etiqueta}
            </Text>
            <Text style={[estilos.porcentajeLeyenda, { color: tema.colores.textoSecundario }]}>
              {segmento.porcentaje}%
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  envoltorioDona: {
    width: TAMANO_SVG,
    height: TAMANO_SVG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: RADIO * 1.4,
  },
  textoCentro: {
    fontSize: 13,
    fontFamily: FUENTES.negrita,
    textAlign: 'center',
  },
  leyenda: {
    gap: 8,
    flexShrink: 1,
    minWidth: 140,
  },
  filaLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textoLeyenda: {
    fontSize: 13,
    flexShrink: 1,
  },
  porcentajeLeyenda: {
    fontSize: 12,
    marginLeft: 'auto',
  },
});
