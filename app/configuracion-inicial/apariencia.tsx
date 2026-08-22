import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { IndicadorPasos } from '@/src/componentes/comunes/IndicadorPasos';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { SelectorTema } from '@/src/componentes/comunes/SelectorTema';
import { useTema } from '@/src/contextos/ContextoTema';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaSeleccionApariencia() {
  const { tema, modo, establecerModo } = useTema();
  const { t } = useTranslation();
  const router = useRouter();

  const continuar = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/configuracion-inicial/finanzas');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <IndicadorPasos totalPasos={3} pasoActual={2} />
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
          <BlurView
                    intensity={30}
                    tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
                    style={estilos.encabezado}
                  >
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
                      {t('configuracionInicial.apariencia.titulo')}
                    </Text>
                    <Text style={[estilos.subtitulo, { color: tema.colores.textoSecundario }]}>
                      {t('configuracionInicial.apariencia.subtitulo')}
                    </Text>
                  </BlurView>
        </Animated.View>

        <SelectorTema modoSeleccionado={modo} onSeleccionar={establecerModo} />

        <BotonPrincipal
          titulo={t('comun.continuar')}
          onPress={continuar}
        />
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 20,
    paddingTop: 24,
  },
  encabezado: {
    gap: 6,
    borderRadius: 6,
    padding: 12,
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 24,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  subtitulo: {
    fontSize: 14,
  },
});
