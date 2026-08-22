import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { BarraProgreso } from '@/src/componentes/comunes/BarraProgreso';
import { Icono } from '@/src/componentes/comunes/Icono';
import { PressableAnimado } from '@/src/componentes/comunes/PressableAnimado';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import { useEscalaPresion } from '@/src/hooks/useEscalaPresion';
import type { CodigoMoneda } from '@/src/tipos/finanzas';
import type { Meta } from '@/src/tipos/meta';
import { calcularProgresoMeta } from '@/src/utilidades/calculosPlanificacion';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

interface PropiedadesTarjetaMeta {
  meta: Meta;
  moneda: CodigoMoneda;
  onPress?: () => void;
}

export function TarjetaMeta({ meta, moneda, onPress }: PropiedadesTarjetaMeta) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const progreso = calcularProgresoMeta(meta);
  const completada = meta.estado === 'completada';
  const { estiloAnimado, onPressIn, onPressOut } = useEscalaPresion();

  return (
    <PressableAnimado
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={meta.nombre}
      style={estiloAnimado}
    >
      <TarjetaCristal>
        <View style={estilos.encabezado}>
          <View style={estilos.identidad}>
            <Icono nombre="flag" tamano={18} color={completada ? tema.colores.ingreso : tema.colores.violeta} />
            <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {meta.nombre}
            </Text>
          </View>
          {completada ? (
            <View style={[estilos.chipCompletada, { backgroundColor: `${tema.colores.ingreso}26` }]}>
              <Text style={{ color: tema.colores.ingreso, fontSize: 11, fontFamily: FUENTES.negrita }}>✓</Text>
            </View>
          ) : null}
        </View>

        <BarraProgreso
          progreso={progreso.porcentaje / 100}
          color={completada ? tema.colores.ingreso : tema.colores.violeta}
          etiquetaAccesibilidad={`${progreso.porcentaje}%`}
        />

        <View style={estilos.pie}>
          <Text style={[estilos.textoPie, { color: tema.colores.textoSecundario }]}>
            {formatearMoneda(meta.montoActual, moneda, idioma)} / {formatearMoneda(meta.montoObjetivo, moneda, idioma)}
          </Text>
          <Text style={[estilos.porcentaje, { color: tema.colores.textoPrincipal }]}>{progreso.porcentaje}%</Text>
        </View>
        {meta.fechaObjetivo ? (
          <Text style={[estilos.fecha, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.metas.fechaObjetivo')}: {new Date(meta.fechaObjetivo).toLocaleDateString()}
          </Text>
        ) : null}
      </TarjetaCristal>
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  identidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nombre: {
    fontSize: 14,
    fontFamily: FUENTES.negrita,
  },
  chipCompletada: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  textoPie: {
    fontSize: 12,
  },
  porcentaje: {
    fontSize: 12,
    fontFamily: FUENTES.negrita,
  },
  fecha: {
    fontSize: 11,
    marginTop: 6,
  },
});
