import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesSelectorComprobante {
  uri: string | null;
  onCambiar: (uri: string | null) => void;
}

export function SelectorComprobante({ uri, onCambiar }: PropiedadesSelectorComprobante) {
  const { tema } = useTema();
  const { t } = useTranslation();

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(t('pantallas.movimientoNuevo.permisoGaleria'));
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    });
    if (!resultado.canceled && resultado.assets[0]) {
      onCambiar(resultado.assets[0].uri);
    }
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.etiqueta, { color: tema.colores.textoSecundario }]}>
        {t('pantallas.movimientoNuevo.comprobante')}
      </Text>
      {uri ? (
        <View style={estilos.filaPrevia}>
          <Image source={{ uri }} style={[estilos.previa, { borderRadius: tema.radios.tarjeta, borderColor: tema.colores.borde }]} />
          <View style={estilos.columnaAcciones}>
            <Pressable
              onPress={elegirFoto}
              accessibilityRole="button"
              accessibilityLabel={t('pantallas.movimientoNuevo.cambiarFoto')}
              style={[estilos.botonAccion, { borderColor: tema.colores.borde }]}
            >
              <Icono nombre="photo-camera" tamano={16} color={tema.colores.textoPrincipal} />
              <Text style={[estilos.textoAccion, { color: tema.colores.textoPrincipal }]}>
                {t('pantallas.movimientoNuevo.cambiarFoto')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onCambiar(null)}
              accessibilityRole="button"
              accessibilityLabel={t('pantallas.movimientoNuevo.quitarFoto')}
              style={[estilos.botonAccion, { borderColor: tema.colores.gasto }]}
            >
              <Icono nombre="delete-outline" tamano={16} color={tema.colores.gasto} />
              <Text style={[estilos.textoAccion, { color: tema.colores.gasto }]}>
                {t('pantallas.movimientoNuevo.quitarFoto')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={elegirFoto}
          accessibilityRole="button"
          accessibilityLabel={t('pantallas.movimientoNuevo.agregarFoto')}
          style={[estilos.botonAgregar, { borderColor: tema.colores.borde, borderRadius: tema.radios.tarjeta }]}
        >
          <Icono nombre="add-a-photo" tamano={20} color={tema.colores.textoSecundario} />
          <Text style={[estilos.textoAgregar, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.movimientoNuevo.agregarFoto')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 8,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '500',
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderStyle: 'dashed',
    paddingVertical: 18,
  },
  textoAgregar: {
    fontSize: 13,
    fontWeight: '600',
  },
  filaPrevia: {
    flexDirection: 'row',
    gap: 12,
  },
  previa: {
    width: 88,
    height: 88,
    borderWidth: StyleSheet.hairlineWidth,
  },
  columnaAcciones: {
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  botonAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  textoAccion: {
    fontSize: 12,
    fontWeight: '600',
  },
});
