import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import type { Categoria } from '@/src/tipos/categoria';
import type { Cuenta } from '@/src/tipos/cuenta';
import type { Movimiento } from '@/src/tipos/movimiento';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';

interface PropiedadesTarjetaMovimiento {
  movimiento: Movimiento;
  categoria?: Categoria;
  cuenta?: Cuenta;
  cuentaDestino?: Cuenta;
  onPress?: () => void;
}

const ICONO_POR_TIPO: Record<Movimiento['tipo'], NombreIcono> = {
  ingreso: 'arrow-downward',
  gasto: 'arrow-upward',
  transferencia: 'swap-horiz',
  ajuste: 'tune',
};

export const TarjetaMovimiento = memo(function TarjetaMovimiento({
  movimiento,
  categoria,
  cuenta,
  cuentaDestino,
  onPress,
}: PropiedadesTarjetaMovimiento) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();

  const colorPorTipo: Record<Movimiento['tipo'], string> = {
    ingreso: tema.colores.ingreso,
    gasto: tema.colores.gasto,
    transferencia: tema.colores.azul,
    ajuste: tema.colores.advertencia,
  };
  const color = colorPorTipo[movimiento.tipo];
  const signo = movimiento.tipo === 'gasto' ? '-' : movimiento.tipo === 'ingreso' || movimiento.tipo === 'ajuste' ? '+' : '';

  const titulo =
    movimiento.descripcion?.trim() ||
    (categoria ? nombreCategoria(categoria, t) : t(`pantallas.movimientoNuevo.${movimiento.tipo}`));

  const subtitulo = [
    movimiento.tipo === 'transferencia'
      ? `${cuenta?.nombre ?? ''} → ${cuentaDestino?.nombre ?? ''}`
      : [categoria ? nombreCategoria(categoria, t) : null, cuenta?.nombre].filter(Boolean).join(' · '),
    new Date(movimiento.fechaMovimiento).toLocaleDateString(),
  ]
    .filter(Boolean)
    .join(' · ');

  const Contenedor = onPress ? Pressable : View;

  return (
    <Contenedor
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[estilos.contenedor, { borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta, borderRadius: tema.radios.tarjeta }]}
    >
      <View style={[estilos.icono, { backgroundColor: `${color}26` }]}>
        <Icono nombre={categoria?.icono as NombreIcono ?? ICONO_POR_TIPO[movimiento.tipo]} tamano={20} color={color} />
      </View>
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
          {titulo}
        </Text>
        <Text style={[estilos.subtitulo, { color: tema.colores.textoSecundario }]} numberOfLines={1}>
          {subtitulo}
        </Text>
      </View>
      <Text style={[estilos.monto, { color }]} numberOfLines={1}>
        {signo}
        {formatearMoneda(movimiento.monto, cuenta?.moneda ?? 'GTQ', idioma)}
      </Text>
    </Contenedor>
  );
});

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitulo: {
    fontSize: 12,
  },
  monto: {
    fontSize: 14,
    fontWeight: '700',
  },
});
