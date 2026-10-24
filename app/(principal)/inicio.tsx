import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { obtenerPerfilDemo } from '@/src/almacenamiento/perfilDemo';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EntradaEscalonada } from '@/src/componentes/comunes/EntradaEscalonada';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { ModalConfirmacion } from '@/src/componentes/comunes/ModalConfirmacion';
import { TarjetaMetrica } from '@/src/componentes/comunes/TarjetaMetrica';
import { TarjetaSaldo } from '@/src/componentes/comunes/TarjetaSaldo';
import { GraficaCategorias } from '@/src/componentes/graficas/GraficaCategorias';
import { GraficaIngresosGastos } from '@/src/componentes/graficas/GraficaIngresosGastos';
import { TarjetaMeta } from '@/src/componentes/metas/TarjetaMeta';
import { TarjetaMovimiento } from '@/src/componentes/movimientos/TarjetaMovimiento';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useSesion } from '@/src/contextos/ContextoSesion';
import { useTema } from '@/src/contextos/ContextoTema';
import { calcularGastosPorCategoria } from '@/src/utilidades/calculosAnalisis';
import {
  calcularResumenPeriodo,
  calcularSaldoCuenta,
  calcularSaldoTotal,
  filtrarMovimientosPorPeriodo,
  obtenerRangoMesActual,
} from '@/src/utilidades/calculosFinancieros';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaInicio() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();
  const { cuentas, categorias, movimientos } = useFinanzas();
  const { metas, archivarMeta } = usePlanificacion();
  const { usuario } = useSesion();
  const [nombre, setNombre] = useState<string | null>(null);
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string | null>(null);
  const [metaAEliminar, setMetaAEliminar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Ver el mismo comentario en app/(principal)/perfil.tsx: con sesión
      // real de Supabase, el nombre sale de ahí, no de la preferencia local
      // "demo" (que solo se llena en el dispositivo donde se hizo el registro).
      if (usuario) {
        setNombre(typeof usuario.user_metadata?.nombre === 'string' ? usuario.user_metadata.nombre : null);
      } else {
        obtenerPerfilDemo().then((perfil) => setNombre(perfil.nombre));
      }
    }, [usuario])
  );

  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaSeleccionadaId) ?? null;
  const moneda = cuentaSeleccionada?.moneda ?? cuentas[0]?.moneda ?? 'GTQ';

  const { inicio, fin } = useMemo(() => obtenerRangoMesActual(), []);
  const movimientosDelPeriodo = useMemo(() => {
    const base = cuentaSeleccionada
      ? movimientos.filter((m) => m.cuentaId === cuentaSeleccionada.id || m.cuentaDestinoId === cuentaSeleccionada.id)
      : movimientos;
    return filtrarMovimientosPorPeriodo(base, inicio, fin);
  }, [movimientos, cuentaSeleccionada, inicio, fin]);

  const resumen = useMemo(() => calcularResumenPeriodo(movimientosDelPeriodo), [movimientosDelPeriodo]);

  const ahorroEnMetas = useMemo(
    () =>
      metas
        .filter((meta) => !cuentaSeleccionada || meta.cuentaId === cuentaSeleccionada.id)
        .reduce((total, meta) => total + meta.montoActual, 0),
    [metas, cuentaSeleccionada]
  );

  const saldoMostrado = cuentaSeleccionada
    ? calcularSaldoCuenta(cuentaSeleccionada, movimientos)
    : calcularSaldoTotal(cuentas, movimientos);

  const movimientosRecientes = useMemo(() => movimientos.slice(0, 5), [movimientos]);

  const segmentosCategorias = useMemo(() => {
    const gastosPorCategoria = calcularGastosPorCategoria(movimientosDelPeriodo);
    return gastosPorCategoria.slice(0, 6).map((entrada) => {
      const categoria = categorias.find((c) => c.id === entrada.categoriaId);
      return {
        id: entrada.categoriaId,
        etiqueta: categoria ? nombreCategoria(categoria, t) : entrada.categoriaId,
        porcentaje: entrada.porcentaje,
        color: categoria?.color ?? tema.colores.violeta,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movimientosDelPeriodo, categorias]);

  const metasActivas = useMemo(() => metas.filter((m) => m.estado === 'activa').slice(0, 3), [metas]);

  const verReporte = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/reporte/mes-actual');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
          <BlurView
                    intensity={30}
                    tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
                    style={estilos.tarjetaSaludo}
                  >
                    <Text style={[estilos.saludo, { color: tema.colores.textoPrincipal }]}>
                      {nombre ? t('pantallas.inicio.saludo', { nombre }) : t('pantallas.inicio.saludoGenerico')}
                    </Text>
                  </BlurView>
        </Animated.View>

        {cuentas.length > 1 ? (
          <View style={estilos.filaChips}>
            <ChipCategoria
              etiqueta={t('comun.verTodo')}
              seleccionado={cuentaSeleccionadaId === null}
              onPress={() => setCuentaSeleccionadaId(null)}
            />
            {cuentas.map((cuenta) => (
              <ChipCategoria
                key={cuenta.id}
                etiqueta={cuenta.nombre}
                seleccionado={cuentaSeleccionadaId === cuenta.id}
                onPress={() => setCuentaSeleccionadaId(cuenta.id)}
              />
            ))}
          </View>
        ) : null}

        <TarjetaSaldo
          etiqueta={cuentaSeleccionada?.nombre ?? t('pantallas.inicio.saldoDisponible')}
          saldo={formatearMoneda(saldoMostrado, moneda, idioma)}
        />

        <BotonSecundario
          titulo={t('configuracionInicial.finanzas.crearCuentaAhora')}
          onPress={() => router.push('/cuenta/nueva')}
        />

        <View style={estilos.filaMetricas}>
          <TarjetaMetrica
            etiqueta={t('pantallas.inicio.ingresosDelMes')}
            valor={formatearMoneda(resumen.ingresos, moneda, idioma)}
            icono="arrow-downward"
            colorAcento={tema.colores.ingreso}
          />
          <TarjetaMetrica
            etiqueta={t('pantallas.inicio.gastosDelMes')}
            valor={formatearMoneda(resumen.gastos, moneda, idioma)}
            icono="arrow-upward"
            colorAcento={tema.colores.gasto}
          />
        </View>
        <View style={estilos.filaMetricas}>
          <TarjetaMetrica
            etiqueta={t('pantallas.inicio.ahorroNeto')}
            valor={formatearMoneda(resumen.ahorroNeto, moneda, idioma)}
            icono="savings"
          />
          <TarjetaMetrica etiqueta={t('pantallas.inicio.tasaAhorro')} valor={`${resumen.tasaAhorro}%`} icono="percent" />
        </View>
        <View style={estilos.filaMetricas}>
          <TarjetaMetrica
            etiqueta={t('pantallas.inicio.ahorroEnMetas')}
            valor={formatearMoneda(ahorroEnMetas, moneda, idioma)}
            icono="flag"
          />
        </View>

        {resumen.ingresos > 0 || resumen.gastos > 0 ? (
          <View style={estilos.seccion}>
            <GraficaIngresosGastos ingresos={resumen.ingresos} gastos={resumen.gastos} moneda={moneda} />
          </View>
        ) : null}

        {segmentosCategorias.length > 0 ? (
          <View style={estilos.seccion}>
            <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.analisis.gastosPorCategoria')}
            </Text>
            <GraficaCategorias segmentos={segmentosCategorias} />
          </View>
        ) : null}

        <View style={estilos.seccion}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.inicio.movimientosRecientes')}
          </Text>
          {movimientosRecientes.length === 0 ? (
            <EstadoVacio titulo={t('pantallas.movimientos.sinMovimientos')} icono="receipt-long" />
          ) : (
            <View style={estilos.listaMovimientos}>
              {movimientosRecientes.map((movimiento, indice) => (
                <EntradaEscalonada key={movimiento.id} indice={indice}>
                  <TarjetaMovimiento
                    movimiento={movimiento}
                    categoria={categorias.find((c) => c.id === movimiento.categoriaId)}
                    cuenta={cuentas.find((c) => c.id === movimiento.cuentaId)}
                    cuentaDestino={cuentas.find((c) => c.id === movimiento.cuentaDestinoId)}
                    onPress={() => router.push(`/movimiento/${movimiento.id}`)}
                  />
                </EntradaEscalonada>
              ))}
            </View>
          )}
        </View>

        <View style={estilos.seccion}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.inicio.progresoMetas')}
          </Text>
          {metasActivas.length === 0 ? (
            <EstadoVacio titulo={t('pantallas.metas.sinMetas')} icono="flag" />
          ) : (
            <View style={estilos.listaMovimientos}>
              {metasActivas.map((meta, indice) => {
                const cuentaMeta = cuentas.find((c) => c.id === meta.cuentaId);
                return (
                  <EntradaEscalonada key={meta.id} indice={indice}>
                    <TarjetaMeta
                      meta={meta}
                      moneda={cuentaMeta?.moneda ?? moneda}
                      onPress={() => router.push(`/meta/${meta.id}`)}
                      onEliminar={() => setMetaAEliminar(meta.id)}
                    />
                  </EntradaEscalonada>
                );
              })}
            </View>
          )}
          <BotonSecundario
            titulo={t('pantallas.metas.nuevaMeta')}
            onPress={() => router.push('/meta/nueva')}
          />
        </View>

        <BotonSecundario
          titulo={t('pantallas.inicio.verReporte')}
          onPress={verReporte}
        />
      </View>

      <ModalConfirmacion
        visible={metaAEliminar !== null}
        titulo={t('pantallas.metas.eliminar')}
        descripcion={t('pantallas.metas.confirmarEliminar')}
        textoConfirmar={t('pantallas.metas.eliminar')}
        textoCancelar={t('comun.cancelar')}
        destructivo
        onConfirmar={() => {
          if (metaAEliminar) archivarMeta(metaAEliminar);
          setMetaAEliminar(null);
        }}
        onCancelar={() => setMetaAEliminar(null)}
      />
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  tarjetaSaludo: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  saludo: {
    fontSize: 22,
    fontFamily: FUENTE_DISPLAY.italica,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filaMetricas: {
    flexDirection: 'row',
    gap: 12,
  },
  seccion: {
    gap: 10,
    marginTop: 8,
  },
  tituloSeccion: {
    fontSize: 16,
    fontFamily: FUENTES.negrita,
  },
  listaMovimientos: {
    gap: 8,
  },
});
