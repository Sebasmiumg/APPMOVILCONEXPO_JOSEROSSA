import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { IndicadorPasos } from '@/src/componentes/comunes/IndicadorPasos';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { SelectorIdioma } from '@/src/componentes/comunes/SelectorIdioma';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';

export default function PantallaSeleccionIdioma() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma, establecerIdioma } = useIdioma();
  const router = useRouter();

  const continuar = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/configuracion-inicial/apariencia');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <IndicadorPasos totalPasos={3} pasoActual={1} />
        <BlurView
          intensity={30}
          tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
          style={estilos.encabezado}
        >
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
            {t('configuracionInicial.idioma.titulo')}
          </Text>
          <Text style={[estilos.subtitulo, { color: tema.colores.textoSecundario }]}>
            {t('configuracionInicial.idioma.subtitulo')}
          </Text>
        </BlurView>

        <SelectorIdioma idiomaSeleccionado={idioma} onSeleccionar={establecerIdioma} />

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
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 14,
  },
});
