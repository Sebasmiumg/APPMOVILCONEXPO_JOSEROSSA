import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgreso } from '@/src/componentes/comunes/BarraProgreso';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import type { Categoria } from '@/src/tipos/categoria';
import type { CodigoMoneda } from '@/src/tipos/finanzas';
import type { ConsumoPresupuesto } from '@/src/tipos/presupuesto';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';

interface PropiedadesTarjetaPresupuesto {
  categoria?: Categoria;
  consumo: ConsumoPresupuesto;
  moneda: CodigoMoneda;
  onEliminar?: () => void;
}

export function TarjetaPresupuesto({ categoria, consumo, moneda, onEliminar }: PropiedadesTarjetaPresupuesto) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();

  const colorPorEstado = {
    normal: tema.colores.violeta,
    advertencia: tema.colores.advertencia,
    excedido: tema.colores.gasto,
  } as const;
  const color = colorPorEstado[consumo.estado];

  return (
    <TarjetaCristal>
      <View style={estilos.encabezado}>
        <View style={estilos.identidad}>
          {categoria ? (
            <Icono nombre={categoria.icono as NombreIcono} tamano={18} color={color} />
          ) : null}
          <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
            {categoria ? nombreCategoria(categoria, t) : ''}
          </Text>
        </View>
        {onEliminar ? (
          <Pressable onPress={onEliminar} accessibilityRole="button" accessibilityLabel={t('comun.eliminar')} hitSlop={8}>
            <Icono nombre="close" tamano={16} color={tema.colores.textoSecundario} />
          </Pressable>
        ) : null}
      </View>

      <BarraProgreso progreso={consumo.porcentaje / 100} color={color} etiquetaAccesibilidad={`${consumo.porcentaje}%`} />

      <View style={estilos.pie}>
        <Text style={[estilos.textoPie, { color: tema.colores.textoSecundario }]}>
          {formatearMoneda(consumo.usado, moneda, idioma)} / {formatearMoneda(
            consumo.usado + Math.max(0, consumo.disponible),
            moneda,
            idioma
          )}
        </Text>
        <Text style={[estilos.porcentaje, { color }]}>{consumo.porcentaje}%</Text>
      </View>
    </TarjetaCristal>
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
    fontWeight: '700',
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
    fontWeight: '700',
  },
});
