import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { IndicadorPasos } from '@/src/componentes/comunes/IndicadorPasos';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { SelectorTema } from '@/src/componentes/comunes/SelectorTema';
import { useTema } from '@/src/contextos/ContextoTema';

export default function PantallaSeleccionApariencia() {
  const { tema, modo, establecerModo } = useTema();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <IndicadorPasos totalPasos={3} pasoActual={2} />
        <View style={estilos.encabezado}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
            {t('configuracionInicial.apariencia.titulo')}
          </Text>
          <Text style={[estilos.subtitulo, { color: tema.colores.textoSecundario }]}>
            {t('configuracionInicial.apariencia.subtitulo')}
          </Text>
        </View>

        <SelectorTema modoSeleccionado={modo} onSeleccionar={establecerModo} />

        <BotonPrincipal
          titulo={t('comun.continuar')}
          onPress={() => router.push('/configuracion-inicial/finanzas')}
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
