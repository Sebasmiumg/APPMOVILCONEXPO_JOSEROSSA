import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BarraProgreso } from '@/src/componentes/comunes/BarraProgreso';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import type { AporteMeta } from '@/src/tipos/meta';
import { calcularAhorroSugeridoMeta, calcularProgresoMeta } from '@/src/utilidades/calculosPlanificacion';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaDetalleMeta() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cuentas } = useFinanzas();
  const { metas, agregarAporteMeta, obtenerAportesMeta, archivarMeta } = usePlanificacion();

  const meta = metas.find((m) => m.id === id);
  const cuenta = cuentas.find((c) => c.id === meta?.cuentaId);
  const moneda = cuenta?.moneda ?? cuentas[0]?.moneda ?? 'GTQ';

  const [aportes, setAportes] = useState<AporteMeta[]>([]);
  const [montoAporte, setMontoAporte] = useState('');
  const [notaAporte, setNotaAporte] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (meta) {
      obtenerAportesMeta(meta.id).then(setAportes);
    }
  }, [meta, obtenerAportesMeta]);

  if (!meta) {
    return (
      <LayoutResponsive>
        <EstadoVacio titulo={t('pantallas.metas.sinMetas')} icono="flag" />
      </LayoutResponsive>
    );
  }

  const progreso = calcularProgresoMeta(meta);
  const sugerido = calcularAhorroSugeridoMeta(meta);
  const completada = meta.estado === 'completada';

  const guardarAporte = async () => {
    const montoNumerico = Number.parseFloat(montoAporte);
    if (!montoNumerico || montoNumerico <= 0) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnviando(true);
    try {
      await agregarAporteMeta(meta.id, montoNumerico, notaAporte.trim() || null);
      const listaActualizada = await obtenerAportesMeta(meta.id);
      setAportes(listaActualizada);
      setMontoAporte('');
      setNotaAporte('');
    } finally {
      setEnviando(false);
    }
  };

  const archivar = async () => {
    await archivarMeta(meta.id);
    volverOIrA(router, '/(principal)/metas');
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
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
                      {meta.nombre}
                    </Text>
                    <Pressable onPress={() => volverOIrA(router, '/(principal)/metas')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
                      <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
                    </Pressable>
                  </BlurView>
        </Animated.View>

        <TarjetaCristal>
          <BarraProgreso
            progreso={progreso.porcentaje / 100}
            color={completada ? tema.colores.ingreso : tema.colores.violeta}
          />
          <View style={estilos.filaMontos}>
            <Text style={[estilos.montoActual, { color: tema.colores.textoPrincipal }]}>
              {formatearMoneda(meta.montoActual, moneda, idioma)}
            </Text>
            <Text style={[estilos.montoObjetivo, { color: tema.colores.textoSecundario }]}>
              {' '}
              / {formatearMoneda(meta.montoObjetivo, moneda, idioma)}
            </Text>
          </View>

          {completada ? (
            <Text style={[estilos.completada, { color: tema.colores.ingreso }]}>
              {t('pantallas.metas.detalle.completada')}
            </Text>
          ) : (
            <>
              {meta.fechaObjetivo ? (
                <Text style={[estilos.fecha, { color: tema.colores.textoSecundario }]}>
                  {t('pantallas.metas.fechaObjetivo')}: {new Date(meta.fechaObjetivo).toLocaleDateString()}
                </Text>
              ) : null}
              {sugerido.porSemana !== null ? (
                <Text style={[estilos.sugerido, { color: tema.colores.violeta }]}>
                  {t('pantallas.metas.detalle.ahorroPorSemana', { monto: formatearMoneda(sugerido.porSemana, moneda, idioma) })}
                </Text>
              ) : null}
            </>
          )}
        </TarjetaCristal>

        {!completada ? (
          <View style={estilos.grupo}>
            <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.metas.detalle.agregarAporte')}
            </Text>
            <CampoMoneda
              etiqueta={t('pantallas.metas.detalle.montoAporte')}
              valor={montoAporte}
              onCambiarValor={setMontoAporte}
            />
            <CampoTexto
              etiqueta={t('pantallas.metas.detalle.notaOpcional')}
              value={notaAporte}
              onChangeText={setNotaAporte}
            />
            <BotonPrincipal
              titulo={t('pantallas.metas.detalle.guardarAporte')}
              onPress={guardarAporte}
              cargando={enviando}
            />
          </View>
        ) : null}

        <View style={estilos.grupo}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.metas.detalle.historialAportes')}
          </Text>
          {aportes.length === 0 ? (
            <EstadoVacio titulo={t('pantallas.metas.detalle.sinAportes')} icono="savings" />
          ) : (
            aportes.map((aporte) => (
              <View key={aporte.id} style={[estilos.filaAporte, { borderColor: tema.colores.borde }]}>
                <View>
                  <Text style={{ color: tema.colores.textoPrincipal, fontFamily: FUENTES.seminegrita }}>
                    {formatearMoneda(aporte.monto, moneda, idioma)}
                  </Text>
                  {aporte.nota ? (
                    <Text style={{ color: tema.colores.textoSecundario, fontSize: 12 }}>{aporte.nota}</Text>
                  ) : null}
                </View>
                <Text style={{ color: tema.colores.textoSecundario, fontSize: 12 }}>
                  {new Date(aporte.fecha).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        <BotonSecundario titulo={t('pantallas.metas.detalle.archivar')} onPress={archivar} />
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
    flex: 1,
    marginRight: 12,
  },
  filaMontos: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  montoActual: {
    fontSize: 20,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  montoObjetivo: {
    fontSize: 14,
  },
  completada: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FUENTES.negrita,
  },
  fecha: {
    marginTop: 8,
    fontSize: 12,
  },
  sugerido: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: FUENTES.seminegrita,
  },
  grupo: {
    gap: 10,
  },
  tituloSeccion: {
    fontSize: 15,
    fontFamily: FUENTES.negrita,
  },
  filaAporte: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: 12,
  },
});
