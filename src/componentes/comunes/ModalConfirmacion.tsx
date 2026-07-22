import { Modal, StyleSheet, Text, View } from 'react-native';

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={estilos.fondo}>
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            estilos.contenedor,
            { backgroundColor: tema.colores.tarjetaElevada, borderRadius: tema.radios.tarjeta, borderColor: tema.colores.borde },
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
        </View>
      </View>
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
    fontWeight: '700',
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
