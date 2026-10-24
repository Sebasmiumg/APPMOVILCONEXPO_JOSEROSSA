import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgreso } from '@/src/componentes/comunes/BarraProgreso';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { Cargador } from '@/src/componentes/comunes/Cargador';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { ModalConfirmacion } from '@/src/componentes/comunes/ModalConfirmacion';
import { SelectorFecha } from '@/src/componentes/comunes/SelectorFecha';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import { crearAporteMeta, eliminarAporteMeta } from '@/src/servicios/laravelApi/aportesMeta';
import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import { crearMetaAPI, eliminarMetaAPI, listarMetasAPI } from '@/src/servicios/laravelApi/metas';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import { formatearFechaSoloDia } from '@/src/utilidades/fechas';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import type { MetaAPI } from '@/src/tipos/laravelApi';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

function fechaISOHoy(): string {
  return formatearFechaSoloDia(new Date());
}

interface PropiedadesTarjetaMeta {
  meta: MetaAPI;
  dinero: (monto: number) => string;
  onEliminar: () => void;
  onAgregarAporte: (monto: number) => Promise<void>;
}

function TarjetaMeta({ meta, dinero, onEliminar, onAgregarAporte }: PropiedadesTarjetaMeta) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const [montoAporte, setMontoAporte] = useState('');
  const [enviandoAporte, setEnviandoAporte] = useState(false);

  const objetivo = Number(meta.monto_objetivo);
  const actual = Number(meta.monto_actual);
  const progreso = objetivo > 0 ? Math.min(actual / objetivo, 1) : 0;

  const agregar = async () => {
    const monto = Number.parseFloat(montoAporte);
    if (!monto || monto <= 0) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnviandoAporte(true);
    try {
      await onAgregarAporte(monto);
      setMontoAporte('');
    } finally {
      setEnviandoAporte(false);
    }
  };

  return (
    <TarjetaCristal estilo={estilos.tarjetaMeta}>
      <View style={estilos.encabezadoMeta}>
        <View style={estilos.infoMeta}>
          <Text style={[estilos.nombreMeta, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
            {meta.nombre}
          </Text>
          <Text style={[estilos.metaTexto, { color: tema.colores.textoSecundario }]}>
            {dinero(actual)} / {dinero(objetivo)}
          </Text>
        </View>
        <Pressable onPress={onEliminar} accessibilityRole="button" accessibilityLabel={t('comun.eliminar')} hitSlop={10}>
          <Icono nombre="delete-outline" tamano={20} color={tema.colores.gasto} />
        </Pressable>
      </View>

      <BarraProgreso progreso={progreso} color={tema.colores.violeta} />

      <ChipCategoria etiqueta={t(`capacitaciones.metas.estados.${meta.estado}`)} />

      <Text style={[estilos.subtituloAportes, { color: tema.colores.textoPrincipal }]}>
        {t('capacitaciones.metas.aportes')} ({meta.aportes?.length ?? 0})
      </Text>
      {!meta.aportes || meta.aportes.length === 0 ? (
        <Text style={[estilos.metaTexto, { color: tema.colores.textoSecundario }]}>
          {t('capacitaciones.metas.sinAportes')}
        </Text>
      ) : (
        meta.aportes.map((aporte) => (
          <Text key={aporte.id} style={[estilos.aporte, { color: tema.colores.textoSecundario }]}>
            {aporte.fecha} · {dinero(Number(aporte.monto))} {aporte.nota ? `· ${aporte.nota}` : ''}
          </Text>
        ))
      )}

      <View style={estilos.filaAgregarAporte}>
        <View style={estilos.campoAporte}>
          <CampoMoneda
            etiqueta={t('capacitaciones.metas.montoAporte')}
            valor={montoAporte}
            onCambiarValor={setMontoAporte}
          />
        </View>
        <BotonSecundario titulo={t('capacitaciones.metas.agregarAporte')} onPress={agregar} deshabilitado={enviandoAporte} />
      </View>
    </TarjetaCristal>
  );
}

export default function PantallaMetasAPI() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();

  const [metas, setMetas] = useState<MetaAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [fechaObjetivo, setFechaObjetivo] = useState<Date | null>(null);
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setMetas(await listarMetasAPI());
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPILaravel ? fallo.codigo : 'respuesta';
      setError(t(`capacitaciones.errores.${codigo}`));
    } finally {
      setCargando(false);
    }
  }, [t]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const dinero = (monto: number) => formatearMoneda(monto, 'GTQ', idioma);

  const registrar = async () => {
    const monto = Number.parseFloat(montoObjetivo);
    if (!nombre.trim()) {
      setErrorFormulario(t('validaciones.campoRequerido'));
      return;
    }
    if (!monto || monto <= 0) {
      setErrorFormulario(t('validaciones.montoInvalido'));
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorFormulario(undefined);
    setEnviando(true);
    try {
      await crearMetaAPI({
        nombre: nombre.trim(),
        monto_objetivo: monto,
        fecha_objetivo: fechaObjetivo ? formatearFechaSoloDia(fechaObjetivo) : undefined,
      });
      setNombre('');
      setMontoObjetivo('');
      setFechaObjetivo(null);
      await cargar();
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPILaravel ? fallo.codigo : 'respuesta';
      setErrorFormulario(t(`capacitaciones.errores.${codigo}`));
    } finally {
      setEnviando(false);
    }
  };

  const agregarAporte = async (meta: MetaAPI, monto: number) => {
    await crearAporteMeta(meta.id, { monto, fecha: fechaISOHoy() });
    await cargar();
  };

  const confirmarEliminar = async () => {
    if (idAEliminar === null) return;
    const id = idAEliminar;
    setIdAEliminar(null);
    await eliminarMetaAPI(id);
    setMetas((actual) => actual.filter((meta) => meta.id !== id));
  };

  return (
    <LayoutResponsive anchoMaximo={820}>
      <View style={estilos.encabezado}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('capacitaciones.metas.titulo')}</Text>
        <Pressable
          onPress={() => volverOIrA(router, '/(principal)/capacitaciones')}
          accessibilityRole="button"
          accessibilityLabel={t('comun.cerrar')}
          hitSlop={12}
        >
          <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
        </Pressable>
      </View>
      <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
        {t('capacitaciones.metas.descripcion')}
      </Text>

      <TarjetaCristal estilo={estilos.formulario}>
        <Text style={[estilos.subtitulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.metas.nuevoTitulo')}
        </Text>

        <CampoTexto etiqueta={t('capacitaciones.metas.nombre')} value={nombre} onChangeText={setNombre} />
        <CampoMoneda
          etiqueta={t('capacitaciones.metas.montoObjetivo')}
          valor={montoObjetivo}
          onCambiarValor={setMontoObjetivo}
        />
        <SelectorFecha
          etiqueta={t('capacitaciones.metas.fechaObjetivo')}
          valor={fechaObjetivo}
          onCambiar={setFechaObjetivo}
        />

        {errorFormulario ? <MensajeError mensaje={errorFormulario} /> : null}

        <BotonPrincipal titulo={t('capacitaciones.metas.crear')} onPress={registrar} cargando={enviando} />
      </TarjetaCristal>

      {cargando ? <Cargador etiqueta={t('capacitaciones.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {!cargando && !error && metas.length === 0 ? (
        <EstadoVacio icono="flag" titulo={t('capacitaciones.metas.sinDatos')} />
      ) : null}

      {metas.map((meta) => (
        <TarjetaMeta
          key={meta.id}
          meta={meta}
          dinero={dinero}
          onEliminar={() => setIdAEliminar(meta.id)}
          onAgregarAporte={(monto) => agregarAporte(meta, monto)}
        />
      ))}

      <ModalConfirmacion
        visible={idAEliminar !== null}
        titulo={t('comun.eliminar')}
        textoConfirmar={t('comun.eliminar')}
        textoCancelar={t('comun.cancelar')}
        destructivo
        onConfirmar={confirmarEliminar}
        onCancelar={() => setIdAEliminar(null)}
      />
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 },
  titulo: { fontSize: 22, fontFamily: FUENTE_DISPLAY.negrita },
  descripcion: { fontSize: 14, lineHeight: 20 },
  formulario: { gap: 14 },
  subtitulo: { fontSize: 16, fontFamily: FUENTES.seminegrita },
  tarjetaMeta: { gap: 10 },
  encabezadoMeta: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  infoMeta: { flex: 1, gap: 2 },
  nombreMeta: { fontSize: 15, fontFamily: FUENTES.seminegrita },
  metaTexto: { fontSize: 12 },
  subtituloAportes: { fontSize: 13, fontFamily: FUENTES.seminegrita, marginTop: 4 },
  aporte: { fontSize: 12 },
  filaAgregarAporte: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
  campoAporte: { flex: 1 },
});
