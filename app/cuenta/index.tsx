import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { ICONOS_TIPO_CUENTA } from '@/src/constantes/finanzas';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import { calcularSaldoCuenta } from '@/src/utilidades/calculosFinancieros';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaCuentas() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();
  const { cuentas, movimientos } = useFinanzas();

  const irANuevaCuenta = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/cuenta/nueva');
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
                    <Pressable
                      onPress={() => volverOIrA(router, '/inicio')}
                      accessibilityRole="button"
                      accessibilityLabel={t('comun.atras')}
                      hitSlop={8}
                      style={[estilos.botonAtras, { borderColor: tema.colores.borde }]}
                    >
                      <Icono nombre="arrow-back" tamano={20} color={tema.colores.textoPrincipal} />
                    </Pressable>
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
                      {t('pantallas.perfil.cuentas')}
                    </Text>
                    <Pressable
                      onPress={irANuevaCuenta}
                      accessibilityRole="button"
                      accessibilityLabel={t('configuracionInicial.finanzas.finalizar')}
                      hitSlop={6}
                      style={[estilos.botonAgregar, { backgroundColor: tema.colores.violeta }]}
                    >
                      <Icono nombre="add" tamano={20} color={tema.colores.sobrePrimario} />
                    </Pressable>
                  </BlurView>
        </Animated.View>

        {cuentas.length === 0 ? (
          <EstadoVacio titulo={t('pantallas.perfil.cuentas')} icono="account-balance-wallet" />
        ) : (
          cuentas.map((cuenta) => (
            <TarjetaCristal key={cuenta.id} estilo={estilos.tarjetaCuenta}>
              <View style={[estilos.icono, { backgroundColor: `${cuenta.color ?? tema.colores.violeta}26` }]}>
                <Icono nombre={ICONOS_TIPO_CUENTA[cuenta.tipo]} tamano={20} color={cuenta.color ?? tema.colores.violeta} />
              </View>
              <View style={estilos.textos}>
                <Text style={[estilos.nombreCuenta, { color: tema.colores.textoPrincipal }]}>{cuenta.nombre}</Text>
                <Text style={[estilos.tipoCuenta, { color: tema.colores.textoSecundario }]}>
                  {t(`configuracionInicial.finanzas.tiposCuenta.${cuenta.tipo}`)}
                </Text>
              </View>
              <Text style={[estilos.saldo, { color: tema.colores.textoPrincipal }]}>
                {formatearMoneda(calcularSaldoCuenta(cuenta, movimientos), cuenta.moneda, idioma)}
              </Text>
            </TarjetaCristal>
          ))
        )}
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 12,
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
    flex: 1,
    marginLeft: 12,
  },
  botonAtras: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregar: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaCuenta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  nombreCuenta: {
    fontSize: 15,
    fontFamily: FUENTES.negrita,
  },
  tipoCuenta: {
    fontSize: 12,
  },
  saldo: {
    fontSize: 15,
    fontFamily: FUENTES.negrita,
  },
});
