import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';
import type { FuenteReinversion } from '@/src/tipos/reinversion';

const ICONO_POR_TIPO: Record<FuenteReinversion['tipoFuente'], 'account-balance' | 'gavel' | 'business' | 'school'> = {
  bancoCentral: 'account-balance',
  regulador: 'gavel',
  entidadFinanciera: 'business',
  institucional: 'school',
};

export function TarjetaFuente({ titulo, entidad, url, fechaConsulta, tipoFuente }: FuenteReinversion) {
  const { tema } = useTema();

  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
      accessibilityLabel={`${titulo} — ${entidad}`}
      style={[estilos.contenedor, { borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta }]}
    >
      <Icono nombre={ICONO_POR_TIPO[tipoFuente]} tamano={16} color={tema.colores.textoSecundario} />
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]} numberOfLines={2}>
          {titulo}
        </Text>
        <Text style={[estilos.meta, { color: tema.colores.textoSecundario }]} numberOfLines={1}>
          {entidad} · {new Date(fechaConsulta).toLocaleDateString()}
        </Text>
      </View>
      <Icono nombre="open-in-new" tamano={14} color={tema.colores.textoSecundario} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textos: {
    flex: 1,
    gap: 1,
  },
  titulo: {
    fontSize: 12,
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
  },
});
