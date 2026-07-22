import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

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

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <IndicadorPasos totalPasos={3} pasoActual={1} />
        <View style={estilos.encabezado}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
            {t('configuracionInicial.idioma.titulo')}
          </Text>
          <Text style={[estilos.subtitulo, { color: tema.colores.textoSecundario }]}>
            {t('configuracionInicial.idioma.subtitulo')}
          </Text>
        </View>

        <SelectorIdioma idiomaSeleccionado={idioma} onSeleccionar={establecerIdioma} />

        <BotonPrincipal
          titulo={t('comun.continuar')}
          onPress={() => router.push('/configuracion-inicial/apariencia')}
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
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitulo: {
    fontSize: 14,
  },
});
