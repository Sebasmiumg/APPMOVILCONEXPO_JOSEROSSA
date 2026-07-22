import { StyleSheet, View } from 'react-native';

import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesIndicadorPasos {
  totalPasos: number;
  pasoActual: number;
}

export function IndicadorPasos({ totalPasos, pasoActual }: PropiedadesIndicadorPasos) {
  const { tema } = useTema();

  return (
    <View style={estilos.fila} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: totalPasos, now: pasoActual }}>
      {Array.from({ length: totalPasos }).map((_, indice) => {
        const activo = indice <= pasoActual - 1;
        return (
          <View
            key={indice}
            style={[
              estilos.punto,
              { backgroundColor: activo ? tema.colores.violeta : tema.colores.borde },
            ]}
          />
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 6,
  },
  punto: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
});
