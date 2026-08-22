import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EntradaEscalonada } from '@/src/componentes/comunes/EntradaEscalonada';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaAlternativa } from '@/src/componentes/reinversion/TarjetaAlternativa';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useTema } from '@/src/contextos/ContextoTema';
import { ALTERNATIVAS_REINVERSION_SEMILLA } from '@/src/servicios/reinversion/alternativasSemilla';
import { SIMBOLOS_MONEDA } from '@/src/constantes/finanzas';
import type { InteresReinversion } from '@/src/tipos/reinversion';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

const INTERESES: { valor: InteresReinversion; icono: NombreIcono }[] = [
  { valor: 'ahorro', icono: 'savings' },
  { valor: 'formacion', icono: 'school' },
  { valor: 'herramientas', icono: 'build' },
  { valor: 'microemprendimiento', icono: 'storefront' },
  { valor: 'negocioExistente', icono: 'business-center' },
  { valor: 'inversionRegulada', icono: 'account-balance' },
];

export default function PantallaReinversion() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { cuentas } = useFinanzas();
  const [monto, setMonto] = useState('');
  const [interesSeleccionado, setInteresSeleccionado] = useState<InteresReinversion | null>(null);

  const moneda = cuentas[0]?.moneda ?? 'GTQ';

  const alternativas = useMemo(
    () => ALTERNATIVAS_REINVERSION_SEMILLA.filter((alt) => alt.interes === interesSeleccionado),
    [interesSeleccionado]
  );

  const seleccionarInteres = (interes: InteresReinversion) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setInteresSeleccionado(interes);
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
                    <LinearGradient colors={tema.gradientePrincipal} style={estilos.bannerTitulo}>
                      <Text style={[estilos.titulo, { color: tema.colores.sobrePrimario }]}>
                        {t('pantallas.reinversion.titulo')}
                      </Text>
                      <Text style={[estilos.descripcion, { color: tema.colores.sobrePrimario }]}>
                        {t('pantallas.reinversion.descripcion')}
                      </Text>
                    </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
<BlurView
          intensity={30}
          tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
          style={[
            estilos.aviso,
            { borderRadius: tema.radios.tarjeta, borderColor: tema.colores.advertencia },
          ]}
        >
          <Icono nombre="info-outline" tamano={20} color={tema.colores.advertencia} />
          <Text style={[estilos.textoAviso, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.reinversion.aviso')}
          </Text>
        </BlurView>
      </Animated.View>

        <CampoMoneda
          etiqueta={t('pantallas.reinversion.montoAConsiderar')}
          valor={monto}
          onCambiarValor={setMonto}
          simboloMoneda={SIMBOLOS_MONEDA[moneda]}
        />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.reinversion.seleccionaInteres')}
          </Text>
          <View style={estilos.filaChips}>
            {INTERESES.map((item) => (
              <ChipCategoria
                key={item.valor}
                etiqueta={t(`reinversion.intereses.${item.valor}`)}
                icono={item.icono}
                seleccionado={interesSeleccionado === item.valor}
                onPress={() => seleccionarInteres(item.valor)}
              />
            ))}
          </View>
        </View>

        {interesSeleccionado ? (
          alternativas.length === 0 ? (
            <EstadoVacio titulo={t('pantallas.reinversion.sinResultados')} icono="search-off" />
          ) : (
            <View style={estilos.listaAlternativas}>
              {alternativas.map((alternativa, indice) => (
                <EntradaEscalonada key={alternativa.id} indice={indice}>
                  <TarjetaAlternativa alternativa={alternativa} />
                </EntradaEscalonada>
              ))}
            </View>
          )
        ) : (
          <EstadoVacio titulo={t('pantallas.reinversion.seleccionaInteres')} icono="trending-up" />
        )}
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
  bannerTitulo: {
    borderRadius: 6,
    padding: 16,
    gap: 6,
  },
  titulo: {
    fontSize: 22,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  descripcion: {
    fontSize: 14,
  },
  aviso: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  textoAviso: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  grupo: {
    gap: 8,
  },
  etiquetaGrupo: {
    fontSize: 13,
    fontFamily: FUENTES.medio,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listaAlternativas: {
    gap: 12,
  },
});
