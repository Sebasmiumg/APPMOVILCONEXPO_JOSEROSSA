import { StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/src/componentes/comunes/Icono';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesMensajeError {
  mensaje: string;
  etiquetaReintentar?: string;
  onReintentar?: () => void;
}

export function MensajeError({ mensaje, etiquetaReintentar, onReintentar }: PropiedadesMensajeError) {
  const { tema } = useTema();

  return (
    <View
      style={[
        estilos.contenedor,
        { borderRadius: tema.radios.tarjeta, backgroundColor: `${tema.colores.gasto}1A`, borderColor: tema.colores.gasto },
      ]}
      accessibilityRole="alert"
    >
      <Icono nombre="error-outline" tamano={20} color={tema.colores.gasto} />
      <Text style={[estilos.texto, { color: tema.colores.textoPrincipal }]}>{mensaje}</Text>
      {onReintentar ? (
        <BotonSecundario titulo={etiquetaReintentar ?? 'Reintentar'} onPress={onReintentar} />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  texto: {
    fontSize: 14,
    lineHeight: 20,
  },
});
