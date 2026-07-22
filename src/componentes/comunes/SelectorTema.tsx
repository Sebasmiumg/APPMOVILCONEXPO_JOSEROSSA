import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';
import { crearTema } from '@/src/temas/crearTema';
import type { ModoTema } from '@/src/tipos/tema';

interface PropiedadesSelectorTema {
  modoSeleccionado: ModoTema;
  onSeleccionar: (modo: ModoTema) => void;
}

export function SelectorTema({ modoSeleccionado, onSeleccionar }: PropiedadesSelectorTema) {
  const { t } = useTranslation();
  const { tema } = useTema();
  const opciones: ModoTema[] = ['oscuro', 'claro'];

  return (
    <View style={estilos.fila}>
      {opciones.map((modo) => {
        const vistaPrevia = crearTema(modo);
        const seleccionado = modo === modoSeleccionado;
        return (
          <Pressable
            key={modo}
            onPress={() => onSeleccionar(modo)}
            accessibilityRole="radio"
            accessibilityState={{ selected: seleccionado }}
            accessibilityLabel={t(`configuracionInicial.apariencia.${modo}`)}
            style={[
              estilos.tarjeta,
              {
                borderRadius: tema.radios.tarjeta,
                borderColor: seleccionado ? tema.colores.violeta : tema.colores.borde,
                backgroundColor: vistaPrevia.colores.fondoPrincipal,
              },
            ]}
          >
            <View
              style={[
                estilos.vistaPreviaTarjeta,
                { backgroundColor: vistaPrevia.colores.tarjeta, borderColor: vistaPrevia.colores.borde },
              ]}
            >
              <View style={[estilos.barra, { backgroundColor: vistaPrevia.colores.violeta, width: '60%' }]} />
              <View style={[estilos.barra, { backgroundColor: vistaPrevia.colores.textoSecundario, width: '80%' }]} />
            </View>
            <View style={estilos.piePagina}>
              <Text style={[estilos.texto, { color: vistaPrevia.colores.textoPrincipal }]}>
                {t(`configuracionInicial.apariencia.${modo}`)}
              </Text>
              {seleccionado ? (
                <Icono nombre="check-circle" tamano={18} color={tema.colores.violeta} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 12,
  },
  tarjeta: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 12,
    gap: 10,
  },
  vistaPreviaTarjeta: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 6,
    minHeight: 64,
    justifyContent: 'center',
  },
  barra: {
    height: 6,
    borderRadius: 999,
  },
  piePagina: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  texto: {
    fontSize: 14,
    fontWeight: '600',
  },
});
