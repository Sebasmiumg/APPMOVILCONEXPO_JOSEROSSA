import { StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesTarjetaMetrica {
  etiqueta: string;
  valor: string;
  icono?: NombreIcono;
  colorAcento?: string;
}

export function TarjetaMetrica({ etiqueta, valor, icono, colorAcento }: PropiedadesTarjetaMetrica) {
  const { tema } = useTema();
  const acento = colorAcento ?? tema.colores.violeta;

  return (
    <TarjetaCristal estilo={estilos.tarjeta} accessible accessibilityLabel={`${etiqueta}. ${valor}`}>
      <View style={estilos.encabezado}>
        {icono ? <Icono nombre={icono} tamano={18} color={acento} /> : null}
        <Text style={[estilos.etiqueta, { color: tema.colores.textoSecundario }]}>{etiqueta}</Text>
      </View>
      <Text style={[estilos.valor, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
        {valor}
      </Text>
    </TarjetaCristal>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flex: 1,
    minWidth: 140,
    gap: 8,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etiqueta: {
    fontSize: 12,
    fontFamily: FUENTES.medio,
  },
  valor: {
    fontSize: 20,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
});
