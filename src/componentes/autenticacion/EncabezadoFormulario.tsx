import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';

interface PropiedadesEncabezadoFormulario {
  titulo: string;
  subtitulo?: string;
}

export function EncabezadoFormulario({ titulo, subtitulo }: PropiedadesEncabezadoFormulario) {
  const { tema } = useTema();
  const router = useRouter();

  return (
    <View style={estilos.contenedor}>
      <Pressable
        onPress={() => volverOIrA(router, '/bienvenida')}
        accessibilityRole="button"
        accessibilityLabel="Atrás"
        hitSlop={12}
        style={[estilos.botonAtras, { borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta }]}
      >
        <Icono nombre="arrow-back" tamano={20} color={tema.colores.textoPrincipal} />
      </Pressable>
      <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{titulo}</Text>
      {subtitulo ? (
        <Text style={[estilos.subtitulo, { color: tema.colores.textoSecundario }]}>{subtitulo}</Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 10,
    marginBottom: 8,
  },
  botonAtras: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 15,
  },
});
