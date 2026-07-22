import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import type { CodigoMoneda } from '@/src/tipos/finanzas';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

interface PropiedadesGraficaIngresosGastos {
  ingresos: number;
  gastos: number;
  moneda: CodigoMoneda;
}

const ALTO = 120;
const ANCHO_BARRA = 64;

export function GraficaIngresosGastos({ ingresos, gastos, moneda }: PropiedadesGraficaIngresosGastos) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();

  const maximo = Math.max(ingresos, gastos, 1);
  const altoIngresos = Math.max(4, (ingresos / maximo) * ALTO);
  const altoGastos = Math.max(4, (gastos / maximo) * ALTO);

  return (
    <View style={estilos.contenedor}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={ANCHO_BARRA * 2 + 40} height={ALTO + 10}>
          <Rect
            x={10}
            y={ALTO - altoIngresos}
            width={ANCHO_BARRA}
            height={altoIngresos}
            rx={8}
            fill={tema.colores.ingreso}
          />
          <Rect
            x={ANCHO_BARRA + 30}
            y={ALTO - altoGastos}
            width={ANCHO_BARRA}
            height={altoGastos}
            rx={8}
            fill={tema.colores.gasto}
          />
        </Svg>
      </View>
      <View style={estilos.leyenda}>
        <View style={estilos.filaLeyenda}>
          <View style={[estilos.punto, { backgroundColor: tema.colores.ingreso }]} />
          <Text style={[estilos.textoLeyenda, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.inicio.ingresosDelMes')}: {formatearMoneda(ingresos, moneda, idioma)}
          </Text>
        </View>
        <View style={estilos.filaLeyenda}>
          <View style={[estilos.punto, { backgroundColor: tema.colores.gasto }]} />
          <Text style={[estilos.textoLeyenda, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.inicio.gastosDelMes')}: {formatearMoneda(gastos, moneda, idioma)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  leyenda: {
    gap: 6,
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
  },
});
