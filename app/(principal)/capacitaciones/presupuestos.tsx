import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
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
import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import {
  crearPresupuestoCapacitacion,
  eliminarPresupuestoCapacitacion,
  listarPresupuestosCapacitacion,
} from '@/src/servicios/laravelApi/presupuestosCapacitacion';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import type { EstadoPresupuestoCapacitacion, PresupuestoCapacitacionAPI } from '@/src/tipos/laravelApi';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

const ESTADOS: EstadoPresupuestoCapacitacion[] = ['planificada', 'en_curso', 'finalizada', 'cancelada'];

function fechaISOHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PantallaPresupuestosCapacitacion() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();

  const [presupuestos, setPresupuestos] = useState<PresupuestoCapacitacionAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [montoAsignado, setMontoAsignado] = useState('');
  const [fechaInicio, setFechaInicio] = useState<Date | null>(new Date());
  const [estado, setEstado] = useState<EstadoPresupuestoCapacitacion>('planificada');
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setPresupuestos(await listarPresupuestosCapacitacion());
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
    const monto = Number.parseFloat(montoAsignado);
    if (!nombre.trim()) {
      setErrorFormulario(t('validaciones.campoRequerido'));
      return;
    }
    if (!monto || monto <= 0) {
      setErrorFormulario(t('validaciones.montoInvalido'));
      return;
    }
    if (!fechaInicio) {
      setErrorFormulario(t('validaciones.campoRequerido'));
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorFormulario(undefined);
    setEnviando(true);
    try {
      await crearPresupuestoCapacitacion({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        monto_asignado: monto,
        fecha_inicio: fechaInicio.toISOString().slice(0, 10),
        estado,
      });
      setNombre('');
      setDescripcion('');
      setMontoAsignado('');
      setFechaInicio(new Date());
      setEstado('planificada');
      await cargar();
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPILaravel ? fallo.codigo : 'respuesta';
      setErrorFormulario(t(`capacitaciones.errores.${codigo}`));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (idAEliminar === null) return;
    const id = idAEliminar;
    setIdAEliminar(null);
    await eliminarPresupuestoCapacitacion(id);
    setPresupuestos((actual) => actual.filter((presupuesto) => presupuesto.id !== id));
  };

  return (
    <LayoutResponsive anchoMaximo={820}>
      <View style={estilos.encabezado}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.presupuestos.titulo')}
        </Text>
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
        {t('capacitaciones.presupuestos.descripcion')}
      </Text>

      <TarjetaCristal estilo={estilos.formulario}>
        <Text style={[estilos.subtitulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.presupuestos.nuevoTitulo')}
        </Text>

        <CampoTexto etiqueta={t('capacitaciones.presupuestos.nombre')} value={nombre} onChangeText={setNombre} />
        <CampoTexto
          etiqueta={t('capacitaciones.presupuestos.descripcionCampo')}
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
        />
        <CampoMoneda
          etiqueta={t('capacitaciones.presupuestos.montoAsignado')}
          valor={montoAsignado}
          onCambiarValor={setMontoAsignado}
        />
        <SelectorFecha
          etiqueta={t('capacitaciones.presupuestos.fechaInicio')}
          valor={fechaInicio}
          onCambiar={setFechaInicio}
        />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('capacitaciones.presupuestos.estado')}
          </Text>
          <View style={estilos.filaChips}>
            {ESTADOS.map((valor) => (
              <ChipCategoria
                key={valor}
                etiqueta={t(`capacitaciones.presupuestos.estados.${valor}`)}
                seleccionado={estado === valor}
                onPress={() => setEstado(valor)}
              />
            ))}
          </View>
        </View>

        {errorFormulario ? <MensajeError mensaje={errorFormulario} /> : null}

        <BotonPrincipal
          titulo={t('capacitaciones.presupuestos.registrar')}
          onPress={registrar}
          cargando={enviando}
        />
      </TarjetaCristal>

      {cargando ? <Cargador etiqueta={t('capacitaciones.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {!cargando && !error && presupuestos.length === 0 ? (
        <EstadoVacio icono="school" titulo={t('capacitaciones.presupuestos.sinDatos')} />
      ) : null}

      {presupuestos.map((presupuesto) => (
        <TarjetaCristal key={presupuesto.id} estilo={estilos.filaPresupuesto}>
          <View style={estilos.infoPresupuesto}>
            <Text style={[estilos.nombrePresupuesto, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {presupuesto.nombre}
            </Text>
            {presupuesto.descripcion ? (
              <Text style={[estilos.metaPresupuesto, { color: tema.colores.textoSecundario }]} numberOfLines={2}>
                {presupuesto.descripcion}
              </Text>
            ) : null}
            <Text style={[estilos.metaPresupuesto, { color: tema.colores.textoSecundario }]}>
              {dinero(Number(presupuesto.monto_ejecutado))} / {dinero(Number(presupuesto.monto_asignado))} ·{' '}
              {presupuesto.fecha_inicio}
            </Text>
            <ChipCategoria etiqueta={t(`capacitaciones.presupuestos.estados.${presupuesto.estado}`)} />
          </View>
          <Pressable
            onPress={() => setIdAEliminar(presupuesto.id)}
            accessibilityRole="button"
            accessibilityLabel={t('comun.eliminar')}
            hitSlop={10}
          >
            <Icono nombre="delete-outline" tamano={20} color={tema.colores.gasto} />
          </Pressable>
        </TarjetaCristal>
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
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  titulo: { fontSize: 22, fontFamily: FUENTE_DISPLAY.negrita },
  descripcion: { fontSize: 14, lineHeight: 20 },
  formulario: { gap: 14 },
  subtitulo: { fontSize: 16, fontFamily: FUENTES.seminegrita },
  grupo: { gap: 8 },
  etiquetaGrupo: { fontSize: 13, fontFamily: FUENTES.medio },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filaPresupuesto: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoPresupuesto: { flex: 1, gap: 6 },
  nombrePresupuesto: { fontSize: 15, fontFamily: FUENTES.seminegrita },
  metaPresupuesto: { fontSize: 12 },
});
