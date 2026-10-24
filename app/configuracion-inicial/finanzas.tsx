import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import {
  guardarConfiguracionFinancieraInicial,
  marcarConfiguracionInicialCompleta,
  omitirConfiguracionFinancieraInicial,
} from '@/src/almacenamiento/configuracionFinancieraInicial';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { IndicadorPasos } from '@/src/componentes/comunes/IndicadorPasos';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { SelectorFecha } from '@/src/componentes/comunes/SelectorFecha';
import {
  ICONOS_TIPO_CUENTA,
  MONEDAS_SOPORTADAS,
  SIMBOLOS_MONEDA,
  TIPOS_CUENTA,
} from '@/src/constantes/finanzas';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import type { CodigoMoneda, TipoCuenta } from '@/src/tipos/finanzas';
import { formatearFechaSoloDia } from '@/src/utilidades/fechas';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaConfiguracionFinanciera() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { crearCuenta } = useFinanzas();
  const { crearMeta } = usePlanificacion();

  const [moneda, setMoneda] = useState<CodigoMoneda>('GTQ');
  const [nombreCuenta, setNombreCuenta] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('efectivo');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [metaAhorro, setMetaAhorro] = useState('');
  const [fechaObjetivo, setFechaObjetivo] = useState<Date | null>(null);
  const [errorNombre, setErrorNombre] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const finalizar = async () => {
    if (!nombreCuenta.trim()) {
      setErrorNombre(t('validaciones.campoRequerido'));
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorNombre(undefined);
    setEnviando(true);

    const saldoInicialNumerico = saldoInicial ? Number.parseFloat(saldoInicial) : 0;
    const metaAhorroNumerica = metaAhorro ? Number.parseFloat(metaAhorro) : undefined;

    // Se crea la cuenta (y la meta, si se indicó) de una vez aquí, en vez de solo guardar
    // la configuración para que un puente en el arranque de SQLite la lea después: ese
    // puente ya corrió una vez al iniciar la app, antes de que este formulario existiera,
    // así que nunca la habría creado a tiempo para el dashboard inicial.
    await guardarConfiguracionFinancieraInicial({
      moneda,
      nombreCuenta: nombreCuenta.trim(),
      tipoCuenta,
      saldoInicial: saldoInicialNumerico,
      metaAhorro: metaAhorroNumerica,
      fechaObjetivo: fechaObjetivo ? formatearFechaSoloDia(fechaObjetivo) : undefined,
    });

    const cuenta = await crearCuenta({
      nombre: nombreCuenta.trim(),
      tipo: tipoCuenta,
      moneda,
      saldoInicial: saldoInicialNumerico,
    });

    if (metaAhorroNumerica && metaAhorroNumerica > 0) {
      await crearMeta({
        nombre: t('configuracionInicial.finanzas.metaInicialNombre'),
        montoObjetivo: metaAhorroNumerica,
        cuentaId: cuenta.id,
        fechaObjetivo: fechaObjetivo ? formatearFechaSoloDia(fechaObjetivo) : null,
      });
    }

    await marcarConfiguracionInicialCompleta();

    setEnviando(false);
    router.replace('/(principal)/inicio');
  };

  const saltar = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await omitirConfiguracionFinancieraInicial();
    router.replace('/(principal)/inicio');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <IndicadorPasos totalPasos={3} pasoActual={3} />
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
          <BlurView
                    intensity={30}
                    tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
                    style={estilos.encabezado}
                  >
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
                      {t('configuracionInicial.finanzas.titulo')}
                    </Text>
                    <Text style={[estilos.subtitulo, { color: tema.colores.textoSecundario }]}>
                      {t('configuracionInicial.finanzas.subtitulo')}
                    </Text>
                  </BlurView>
        </Animated.View>

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

        <CampoTexto
          etiqueta={t('configuracionInicial.finanzas.nombreCuenta')}
          value={nombreCuenta}
          onChangeText={setNombreCuenta}
          error={errorNombre}
        />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('configuracionInicial.finanzas.tipoCuenta')}
          </Text>
          <View style={estilos.filaChips}>
            {TIPOS_CUENTA.map((tipo) => (
              <ChipCategoria
                key={tipo}
                etiqueta={t(`configuracionInicial.finanzas.tiposCuenta.${tipo}`)}
                icono={ICONOS_TIPO_CUENTA[tipo]}
                seleccionado={tipoCuenta === tipo}
                onPress={() => setTipoCuenta(tipo)}
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

        <CampoMoneda
          etiqueta={t('configuracionInicial.finanzas.metaAhorroOpcional')}
          valor={metaAhorro}
          onCambiarValor={setMetaAhorro}
          simboloMoneda={SIMBOLOS_MONEDA[moneda]}
        />

        <SelectorFecha
          etiqueta={t('configuracionInicial.finanzas.fechaObjetivoOpcional')}
          valor={fechaObjetivo}
          onCambiar={setFechaObjetivo}
          fechaMinima={new Date()}
        />

        <BotonPrincipal
          titulo={t('configuracionInicial.finanzas.finalizar')}
          onPress={finalizar}
          cargando={enviando}
        />

        <Pressable onPress={saltar} disabled={enviando} hitSlop={8} accessibilityRole="button">
          <Text style={[estilos.saltar, { color: tema.colores.textoSecundario }]}>
            {t('configuracionInicial.finanzas.saltar')}
          </Text>
        </Pressable>
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 18,
    paddingTop: 24,
    paddingBottom: 24,
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
  saltar: {
    fontSize: 14,
    fontFamily: FUENTES.medio,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
