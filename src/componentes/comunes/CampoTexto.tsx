import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesCampoTexto extends TextInputProps {
  etiqueta: string;
  error?: string;
  esContrasena?: boolean;
}

export function CampoTexto({
  etiqueta,
  error,
  esContrasena = false,
  style,
  ...resto
}: PropiedadesCampoTexto) {
  const { tema } = useTema();
  const [ocultarTexto, setOcultarTexto] = useState(esContrasena);

  return (
    <View style={estilos.contenedor}>
      {etiqueta ? (
        <Text style={[estilos.etiqueta, { color: tema.colores.textoSecundario }]}>{etiqueta}</Text>
      ) : null}
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
        <TextInput
          accessibilityLabel={etiqueta || (typeof resto.placeholder === 'string' ? resto.placeholder : undefined)}
          placeholderTextColor={tema.colores.textoSecundario}
          secureTextEntry={ocultarTexto}
          style={[estilos.entrada, { color: tema.colores.textoPrincipal }, style]}
          {...resto}
        />
        {esContrasena && (
          <Pressable
            onPress={() => setOcultarTexto((valor) => !valor)}
            accessibilityRole="button"
            accessibilityLabel={ocultarTexto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            hitSlop={8}
          >
            <Icono
              nombre={ocultarTexto ? 'visibility' : 'visibility-off'}
              tamano={20}
              color={tema.colores.textoSecundario}
            />
          </Pressable>
        )}
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
  entrada: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
  },
  error: {
    fontSize: 12,
  },
});
