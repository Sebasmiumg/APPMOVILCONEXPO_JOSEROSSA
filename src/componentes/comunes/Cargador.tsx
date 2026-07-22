import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesCargador {
  etiqueta?: string;
  pantallaCompleta?: boolean;
}

export function Cargador({ etiqueta, pantallaCompleta = false }: PropiedadesCargador) {
  const { tema } = useTema();

  return (
    <View
      style={[
        estilos.contenedor,
        pantallaCompleta && { flex: 1, backgroundColor: tema.colores.fondoPrincipal },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta ?? 'Cargando'}
    >
      <ActivityIndicator color={tema.colores.violeta} size={pantallaCompleta ? 'large' : 'small'} />
      {etiqueta ? (
        <Text style={[estilos.texto, { color: tema.colores.textoSecundario }]}>{etiqueta}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  texto: {
    fontSize: 13,
  },
});
