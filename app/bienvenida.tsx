import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { useTema } from '@/src/contextos/ContextoTema';

export default function PantallaBienvenida() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();

  const irARegistro = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/autenticacion/registro');
  };

  const irAIniciarSesion = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/autenticacion/iniciar-sesion');
  };

  return (
    <View style={[estilos.raiz, { backgroundColor: tema.colores.fondoPrincipal }]}>
      <LinearGradient
        colors={[`${tema.colores.violeta}33`, 'transparent']}
        style={estilos.resplandor}
      />
      <SafeAreaView style={estilos.contenido}>
        <View style={estilos.encabezado}>
          <Text style={[estilos.marca, { color: tema.colores.textoPrincipal }]}>MiPresupuesto</Text>
        </View>

        <View style={estilos.cuerpo}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
            {t('bienvenida.titulo')}
          </Text>
          <Text style={[estilos.resumen, { color: tema.colores.textoSecundario }]}>
            {t('bienvenida.resumen')}
          </Text>
        </View>

        <View style={estilos.acciones}>
          <BotonPrincipal
            titulo={t('bienvenida.crearCuenta')}
            onPress={irARegistro}
          />
          <BotonSecundario
            titulo={t('bienvenida.iniciarSesion')}
            onPress={irAIniciarSesion}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  resplandor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
  },
  contenido: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  encabezado: {
    marginTop: 24,
  },
  marca: {
    fontSize: 20,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  cuerpo: {
    gap: 12,
  },
  titulo: {
    fontSize: 30,
    fontFamily: FUENTE_DISPLAY.negrita,
    lineHeight: 38,
  },
  resumen: {
    fontSize: 16,
    lineHeight: 24,
  },
  acciones: {
    gap: 12,
  },
});
