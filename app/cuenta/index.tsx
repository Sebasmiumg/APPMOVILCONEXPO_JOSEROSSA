import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
        <BlurView
          intensity={30}
          tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
          style={estilos.encabezado}
        >
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.perfil.cuentas')}
          </Text>
          <Pressable
            onPress={irANuevaCuenta}
            accessibilityRole="button"
            accessibilityLabel={t('configuracionInicial.finanzas.finalizar')}
            style={[estilos.botonAgregar, { backgroundColor: tema.colores.violeta }]}
          >
            <Icono nombre="add" tamano={20} color={tema.colores.sobrePrimario} />
          </Pressable>
        </BlurView>

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
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  botonAgregar: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  nombreCuenta: {
    fontSize: 15,
    fontWeight: '700',
  },
  tipoCuenta: {
    fontSize: 12,
  },
  saldo: {
    fontSize: 15,
    fontWeight: '700',
  },
});
