import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';
import {
  IDIOMAS_SOPORTADOS,
  NOMBRES_NATIVOS_IDIOMA,
  type CodigoIdioma,
} from '@/src/idiomas/configuracionIdioma';

interface PropiedadesSelectorIdioma {
  idiomaSeleccionado: CodigoIdioma;
  onSeleccionar: (idioma: CodigoIdioma) => void;
}

export function SelectorIdioma({ idiomaSeleccionado, onSeleccionar }: PropiedadesSelectorIdioma) {
  const { tema } = useTema();

  return (
    <View style={estilos.lista}>
      {IDIOMAS_SOPORTADOS.map((codigo) => {
        const seleccionado = codigo === idiomaSeleccionado;
        const nombreNativo = NOMBRES_NATIVOS_IDIOMA[codigo];
        return (
          <Pressable
            key={codigo}
            onPress={() => onSeleccionar(codigo)}
            accessibilityRole="radio"
            accessibilityState={{ selected: seleccionado }}
            accessibilityLabel={nombreNativo}
            style={[
              estilos.tarjeta,
              {
                borderRadius: tema.radios.tarjeta,
                borderColor: seleccionado ? tema.colores.violeta : tema.colores.borde,
                backgroundColor: seleccionado ? `${tema.colores.violeta}1A` : tema.colores.tarjeta,
              },
            ]}
          >
            <Text style={[estilos.nombreNativo, { color: tema.colores.textoPrincipal }]}>
              {nombreNativo}
            </Text>
            {seleccionado ? (
              <Icono nombre="check-circle" tamano={20} color={tema.colores.violeta} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    gap: 10,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 44,
  },
  nombreNativo: {
    fontSize: 16,
    fontFamily: FUENTES.seminegrita,
  },
});
