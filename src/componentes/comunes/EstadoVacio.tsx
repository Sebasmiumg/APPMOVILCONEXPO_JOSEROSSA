import { StyleSheet, Text, View } from 'react-native';

import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesEstadoVacio {
  titulo: string;
  descripcion?: string;
  icono?: NombreIcono;
}

export function EstadoVacio({ titulo, descripcion, icono = 'inbox' }: PropiedadesEstadoVacio) {
  const { tema } = useTema();

  return (
    <View style={estilos.contenedor} accessibilityRole="text">
      <Icono nombre={icono} tamano={40} color={tema.colores.textoSecundario} />
      <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{titulo}</Text>
      {descripcion ? (
        <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
          {descripcion}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  descripcion: {
    fontSize: 14,
    textAlign: 'center',
  },
});
