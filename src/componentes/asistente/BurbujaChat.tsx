import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesBurbujaChat {
  contenido: string;
  esUsuario: boolean;
  hora: string;
  datosUtilizados?: string;
}

export const BurbujaChat = memo(function BurbujaChat({ contenido, esUsuario, hora, datosUtilizados }: PropiedadesBurbujaChat) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const hablante = t(esUsuario ? 'pantallas.asistente.hablanteUsuario' : 'pantallas.asistente.hablanteAsistente');
  const etiquetaAccesibilidad = [hablante, contenido, datosUtilizados, hora].filter(Boolean).join('. ');

  return (
    <View style={[estilos.fila, { justifyContent: esUsuario ? 'flex-end' : 'flex-start' }]}>
      <View style={{ maxWidth: '82%' }} accessible accessibilityLabel={etiquetaAccesibilidad}>
        <View
          style={[
            estilos.burbuja,
            {
              borderRadius: tema.radios.tarjeta,
              backgroundColor: esUsuario ? tema.colores.violeta : tema.colores.tarjeta,
              borderColor: tema.colores.borde,
              borderWidth: esUsuario ? 0 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <Text style={{ color: esUsuario ? tema.colores.sobrePrimario : tema.colores.textoPrincipal, fontSize: 14, lineHeight: 20 }}>
            {contenido}
          </Text>
          <Text
            style={[
              estilos.hora,
              { color: esUsuario ? 'rgba(255,255,255,0.7)' : tema.colores.textoSecundario },
            ]}
          >
            {hora}
          </Text>
        </View>
        {datosUtilizados ? (
          <Text style={[estilos.datosUtilizados, { color: tema.colores.textoSecundario }]}>{datosUtilizados}</Text>
        ) : null}
      </View>
    </View>
  );
});

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
  },
  burbuja: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  hora: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  datosUtilizados: {
    fontSize: 10,
    marginTop: 3,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});
