import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { EntradaEscalonada } from '@/src/componentes/comunes/EntradaEscalonada';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaMeta } from '@/src/componentes/metas/TarjetaMeta';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaMetas() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { cuentas } = useFinanzas();
  const { metas } = usePlanificacion();

  const monedaPorDefecto = cuentas[0]?.moneda ?? 'GTQ';

  const irANuevaMeta = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/meta/nueva');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
          <BlurView
                    intensity={30}
                    tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
                    style={estilos.encabezado}
                  >
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('pantallas.metas.titulo')}</Text>
                  </BlurView>
        </Animated.View>

        {metas.length === 0 ? (
          <EstadoVacio titulo={t('pantallas.metas.sinMetas')} icono="flag" />
        ) : (
          <View style={estilos.lista}>
            {metas.map((meta, indice) => {
              const cuenta = cuentas.find((c) => c.id === meta.cuentaId);
              return (
                <EntradaEscalonada key={meta.id} indice={indice}>
                  <TarjetaMeta
                    meta={meta}
                    moneda={cuenta?.moneda ?? monedaPorDefecto}
                    onPress={() => router.push(`/meta/${meta.id}`)}
                  />
                </EntradaEscalonada>
              );
            })}
          </View>
        )}

        <BotonPrincipal titulo={t('pantallas.metas.nuevaMeta')} onPress={irANuevaMeta} />
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 22,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  lista: {
    gap: 12,
  },
});
