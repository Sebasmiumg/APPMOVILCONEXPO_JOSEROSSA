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
import { SelectorFecha } from '@/src/componentes/comunes/SelectorFecha';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { SIMBOLOS_MONEDA } from '@/src/constantes/finanzas';
import { formatearFechaSoloDia } from '@/src/utilidades/fechas';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaNuevaMeta() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { cuentas } = useFinanzas();
  const { crearMeta } = usePlanificacion();

  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [montoActual, setMontoActual] = useState('');
  const [cuentaId, setCuentaId] = useState<string | undefined>();
  const [fechaObjetivo, setFechaObjetivo] = useState<Date | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const simboloMoneda = SIMBOLOS_MONEDA[cuentas.find((cuenta) => cuenta.id === cuentaId)?.moneda ?? cuentas[0]?.moneda ?? 'GTQ'];

  const guardar = async () => {
    const objetivoNumerico = Number.parseFloat(montoObjetivo);
    if (!nombre.trim()) {
      setError(t('validaciones.campoRequerido'));
      return;
    }
    if (!objetivoNumerico || objetivoNumerico <= 0) {
      setError(t('validaciones.montoInvalido'));
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(undefined);
    setEnviando(true);
    try {
      await crearMeta({
        nombre: nombre.trim(),
        montoObjetivo: objetivoNumerico,
        montoActual: montoActual ? Number.parseFloat(montoActual) : 0,
        cuentaId: cuentaId ?? null,
        fechaObjetivo: fechaObjetivo ? formatearFechaSoloDia(fechaObjetivo) : null,
      });
      volverOIrA(router, '/(principal)/metas');
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
                      {t('pantallas.metas.nuevaMeta')}
                    </Text>
                    <Pressable onPress={() => volverOIrA(router, '/(principal)/metas')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
                      <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
                    </Pressable>
                  </BlurView>
        </Animated.View>

        <CampoTexto etiqueta={t('pantallas.metas.formulario.nombre')} value={nombre} onChangeText={setNombre} />

        <CampoMoneda
          etiqueta={t('pantallas.metas.formulario.montoObjetivo')}
          valor={montoObjetivo}
          onCambiarValor={setMontoObjetivo}
          simboloMoneda={simboloMoneda}
        />

        <CampoMoneda
          etiqueta={t('pantallas.metas.formulario.montoActualOpcional')}
          valor={montoActual}
          onCambiarValor={setMontoActual}
          simboloMoneda={simboloMoneda}
        />

        {cuentas.length > 0 ? (
          <View style={estilos.grupo}>
            <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
              {t('pantallas.metas.formulario.cuentaAsociada')}
            </Text>
            <View style={estilos.filaChips}>
              {cuentas.map((cuenta) => (
                <ChipCategoria
                  key={cuenta.id}
                  etiqueta={cuenta.nombre}
                  seleccionado={cuentaId === cuenta.id}
                  onPress={() => setCuentaId((actual) => (actual === cuenta.id ? undefined : cuenta.id))}
                />
              ))}
            </View>
          </View>
        ) : null}

        <SelectorFecha
          etiqueta={t('pantallas.metas.formulario.fechaObjetivoOpcional')}
          valor={fechaObjetivo}
          onCambiar={setFechaObjetivo}
          fechaMinima={new Date()}
        />

        {error ? <MensajeError mensaje={error} /> : null}

        <BotonPrincipal titulo={t('pantallas.metas.formulario.crear')} onPress={guardar} cargando={enviando} />
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
