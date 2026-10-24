import { Linking, StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono } from '@/src/componentes/comunes/Icono';
import { PressableAnimado } from '@/src/componentes/comunes/PressableAnimado';
import { useTema } from '@/src/contextos/ContextoTema';
import { useEscalaPresion } from '@/src/hooks/useEscalaPresion';
import type { FuenteReinversion } from '@/src/tipos/reinversion';
import { analizarFechaSoloDia } from '@/src/utilidades/fechas';

const ICONO_POR_TIPO: Record<FuenteReinversion['tipoFuente'], 'account-balance' | 'gavel' | 'business' | 'school'> = {
  bancoCentral: 'account-balance',
  regulador: 'gavel',
  entidadFinanciera: 'business',
  institucional: 'school',
};

export function TarjetaFuente({ titulo, entidad, url, fechaConsulta, tipoFuente }: FuenteReinversion) {
  const { tema } = useTema();
  const { estiloAnimado, onPressIn, onPressOut } = useEscalaPresion();

  return (
    <PressableAnimado
      onPress={() => Linking.openURL(url)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="link"
      accessibilityLabel={`${titulo} — ${entidad}`}
      style={[estiloAnimado, estilos.contenedor, { borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta }]}
    >
      <Icono nombre={ICONO_POR_TIPO[tipoFuente]} tamano={16} color={tema.colores.textoSecundario} />
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]} numberOfLines={2}>
          {titulo}
        </Text>
        <Text style={[estilos.meta, { color: tema.colores.textoSecundario }]} numberOfLines={1}>
          {entidad} · {analizarFechaSoloDia(fechaConsulta).toLocaleDateString()}
        </Text>
      </View>
      <Icono nombre="open-in-new" tamano={14} color={tema.colores.textoSecundario} />
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textos: {
    flex: 1,
    gap: 1,
  },
  titulo: {
    fontSize: 12,
    fontFamily: FUENTES.seminegrita,
  },
  meta: {
    fontSize: 11,
  },
});
