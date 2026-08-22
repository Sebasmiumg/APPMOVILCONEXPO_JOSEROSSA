import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesModalConfirmacion {
  visible: boolean;
  titulo: string;
  descripcion?: string;
  textoConfirmar: string;
  textoCancelar: string;
  destructivo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmacion({
  visible,
  titulo,
  descripcion,
  textoConfirmar,
  textoCancelar,
  onConfirmar,
  onCancelar,
}: PropiedadesModalConfirmacion) {
  const { tema } = useTema();
  const opacidadFondo = useSharedValue(0);
  const escalaDialogo = useSharedValue(0.92);

  useEffect(() => {
    if (visible) {
      opacidadFondo.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      escalaDialogo.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else {
      opacidadFondo.value = withTiming(0, { duration: 150 });
      escalaDialogo.value = withTiming(0.92, { duration: 150 });
    }
  }, [visible, opacidadFondo, escalaDialogo]);

  const estiloFondo = useAnimatedStyle(() => ({ opacity: opacidadFondo.value }));
  const estiloDialogo = useAnimatedStyle(() => ({
    opacity: opacidadFondo.value,
    transform: [{ scale: escalaDialogo.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancelar}>
      <Animated.View style={[estilos.fondo, estiloFondo]}>
        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            estilos.contenedor,
            { backgroundColor: tema.colores.tarjetaElevada, borderRadius: tema.radios.tarjeta, borderColor: tema.colores.borde },
            estiloDialogo,
          ]}
        >
          <Text
            style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}
            accessibilityLiveRegion="polite"
          >
            {titulo}
          </Text>
          {descripcion ? (
            <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
              {descripcion}
            </Text>
          ) : null}
          <View style={estilos.acciones}>
            <BotonSecundario titulo={textoCancelar} onPress={onCancelar} />
            <BotonPrincipal titulo={textoConfirmar} onPress={onConfirmar} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contenedor: {
    width: '100%',
    maxWidth: 420,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  titulo: {
    fontSize: 18,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 20,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
});
