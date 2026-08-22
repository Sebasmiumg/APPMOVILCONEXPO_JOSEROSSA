import { StyleSheet, Text, TextInput, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesCampoMoneda {
  etiqueta: string;
  valor: string;
  onCambiarValor: (valor: string) => void;
  simboloMoneda?: string;
  error?: string;
  marcadorPosicion?: string;
}

function normalizarEntradaMonetaria(texto: string): string {
  const limpio = texto.replace(/[^0-9.]/g, '');
  const partes = limpio.split('.');
  const entero = partes[0] ?? '';
  const decimales = partes.slice(1).join('').slice(0, 2);
  return partes.length > 1 ? `${entero}.${decimales}` : entero;
}

export function CampoMoneda({
  etiqueta,
  valor,
  onCambiarValor,
  simboloMoneda = 'Q',
  error,
  marcadorPosicion = '0.00',
}: PropiedadesCampoMoneda) {
  const { tema } = useTema();

  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.etiqueta, { color: tema.colores.textoSecundario }]}>{etiqueta}</Text>
      <View
        style={[
          estilos.envoltorioEntrada,
          {
            borderRadius: tema.radios.boton,
            borderColor: error ? tema.colores.gasto : tema.colores.borde,
            backgroundColor: tema.colores.tarjeta,
            minHeight: tema.alturaControlMinima,
          },
        ]}
      >
        <Text style={[estilos.simbolo, { color: tema.colores.textoSecundario }]}>{simboloMoneda}</Text>
        <TextInput
          accessibilityLabel={etiqueta}
          value={valor}
          onChangeText={(texto) => onCambiarValor(normalizarEntradaMonetaria(texto))}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder={marcadorPosicion}
          placeholderTextColor={tema.colores.textoSecundario}
          style={[estilos.entrada, { color: tema.colores.textoPrincipal }]}
        />
      </View>
      {error ? (
        <Text style={[estilos.error, { color: tema.colores.gasto }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 6,
  },
  etiqueta: {
    fontSize: 13,
    fontFamily: FUENTES.medio,
  },
  envoltorioEntrada: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 14,
    gap: 8,
  },
  simbolo: {
    fontSize: 16,
    fontFamily: FUENTES.seminegrita,
  },
  entrada: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  error: {
    fontSize: 12,
  },
});
