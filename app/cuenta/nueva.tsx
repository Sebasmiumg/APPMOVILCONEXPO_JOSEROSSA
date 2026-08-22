import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { ICONOS_TIPO_CUENTA, MONEDAS_SOPORTADAS, SIMBOLOS_MONEDA, TIPOS_CUENTA } from '@/src/constantes/finanzas';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useTema } from '@/src/contextos/ContextoTema';
import type { CodigoMoneda, TipoCuenta } from '@/src/tipos/finanzas';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaNuevaCuenta() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { crearCuenta } = useFinanzas();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoCuenta>('efectivo');
  const [moneda, setMoneda] = useState<CodigoMoneda>('GTQ');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!nombre.trim()) {
      setError(t('validaciones.campoRequerido'));
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(undefined);
    setEnviando(true);
    try {
      await crearCuenta({
        nombre: nombre.trim(),
        tipo,
        moneda,
        saldoInicial: saldoInicial ? Number.parseFloat(saldoInicial) : 0,
      });
      volverOIrA(router, '/cuenta');
    } finally {
      setEnviando(false);
    }
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
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
                      {t('configuracionInicial.finanzas.nombreCuenta')}
                    </Text>
                    <Pressable onPress={() => volverOIrA(router, '/cuenta')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
                      <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
                    </Pressable>
                  </BlurView>
        </Animated.View>

        <CampoTexto etiqueta={t('configuracionInicial.finanzas.nombreCuenta')} value={nombre} onChangeText={setNombre} />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('configuracionInicial.finanzas.tipoCuenta')}
          </Text>
          <View style={estilos.filaChips}>
            {TIPOS_CUENTA.map((valor) => (
              <ChipCategoria
                key={valor}
                etiqueta={t(`configuracionInicial.finanzas.tiposCuenta.${valor}`)}
                icono={ICONOS_TIPO_CUENTA[valor]}
                seleccionado={tipo === valor}
                onPress={() => setTipo(valor)}
              />
            ))}
          </View>
        </View>

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('configuracionInicial.finanzas.moneda')}
          </Text>
          <View style={estilos.filaChips}>
            {MONEDAS_SOPORTADAS.map((codigo) => (
              <ChipCategoria
                key={codigo}
                etiqueta={`${codigo} (${SIMBOLOS_MONEDA[codigo]})`}
                seleccionado={moneda === codigo}
                onPress={() => setMoneda(codigo)}
              />
            ))}
          </View>
        </View>

        <CampoMoneda
          etiqueta={t('configuracionInicial.finanzas.saldoInicial')}
          valor={saldoInicial}
          onCambiarValor={setSaldoInicial}
          simboloMoneda={SIMBOLOS_MONEDA[moneda]}
        />

        {error ? <MensajeError mensaje={error} /> : null}

        <BotonPrincipal titulo={t('configuracionInicial.finanzas.finalizar')} onPress={guardar} cargando={enviando} />
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 20,
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
    fontSize: 20,
    fontFamily: FUENTE_DISPLAY.negrita,
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
});
