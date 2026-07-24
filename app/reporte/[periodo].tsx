import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { TarjetaRecomendacion } from '@/src/componentes/comunes/TarjetaRecomendacion';
import { GraficaCategorias } from '@/src/componentes/graficas/GraficaCategorias';
import { TarjetaMovimiento } from '@/src/componentes/movimientos/TarjetaMovimiento';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import {
  compartirArchivoTexto,
  exportarYCompartirPDF,
  generarCSV,
  generarHTMLReporte,
  type FilaMovimientoReporte,
} from '@/src/servicios/reportes/exportarReporte';
import { calcularCategoriaConMayorGasto, calcularGastosPorCategoria } from '@/src/utilidades/calculosAnalisis';
import {
  calcularResumenPeriodo,
  calcularSaldoTotal,
  obtenerRangoMesAnterior,
  obtenerRangoMesActual,
} from '@/src/utilidades/calculosFinancieros';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';

type ClavePeriodo = 'mes-actual' | 'mes-anterior';

export default function PantallaReporte() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();
  const { periodo } = useLocalSearchParams<{ periodo: string }>();
  const { cuentas, categorias, movimientos } = useFinanzas();
  const { metas, presupuestos } = usePlanificacion();

  const [claveperiodo, setClavePeriodo] = useState<ClavePeriodo>(periodo === 'mes-anterior' ? 'mes-anterior' : 'mes-actual');
  const [cuentaFiltroId, setCuentaFiltroId] = useState<string | null>(null);
  const [exportando, setExportando] = useState<'csv' | 'pdf' | null>(null);

  const cuentasFiltradas = cuentaFiltroId ? cuentas.filter((c) => c.id === cuentaFiltroId) : cuentas;
  const moneda = cuentasFiltradas[0]?.moneda ?? 'GTQ';
  const rango = claveperiodo === 'mes-actual' ? obtenerRangoMesActual() : obtenerRangoMesAnterior();

  const datos = useMemo(() => {
    const idsCuentas = new Set(cuentasFiltradas.map((c) => c.id));
    const perteneceACuentas = (m: (typeof movimientos)[number]) =>
      !cuentaFiltroId || idsCuentas.has(m.cuentaId) || (m.cuentaDestinoId && idsCuentas.has(m.cuentaDestinoId));

    const movimientosAntes = movimientos.filter((m) => perteneceACuentas(m) && m.fechaMovimiento < rango.inicio);
    const movimientosHastaFin = movimientos.filter((m) => perteneceACuentas(m) && m.fechaMovimiento <= rango.fin);
    const movimientosDelPeriodo = movimientos.filter(
      (m) => perteneceACuentas(m) && m.fechaMovimiento >= rango.inicio && m.fechaMovimiento <= rango.fin
    );

    return {
      saldoInicial: calcularSaldoTotal(cuentasFiltradas, movimientosAntes),
      saldoFinal: calcularSaldoTotal(cuentasFiltradas, movimientosHastaFin),
      resumen: calcularResumenPeriodo(movimientosDelPeriodo),
      movimientosDelPeriodo,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movimientos, cuentasFiltradas, cuentaFiltroId, rango.inicio, rango.fin]);

  const gastosPorCategoria = calcularGastosPorCategoria(datos.movimientosDelPeriodo);
  const segmentos = gastosPorCategoria.slice(0, 8).map((entrada) => {
    const categoria = categorias.find((c) => c.id === entrada.categoriaId);
    return {
      id: entrada.categoriaId,
      etiqueta: categoria ? nombreCategoria(categoria, t) : entrada.categoriaId,
      porcentaje: entrada.porcentaje,
      color: categoria?.color ?? tema.colores.violeta,
    };
  });
  const categoriaMayorGasto = calcularCategoriaConMayorGasto(datos.movimientosDelPeriodo, categorias);
  const presupuestosDelPeriodo = claveperiodo === 'mes-actual' ? presupuestos : [];

  const etiquetaPeriodo = t(claveperiodo === 'mes-actual' ? 'pantallas.reporte.periodoActual' : 'pantallas.reporte.periodoAnterior');

  const construirFilasMovimientos = (): FilaMovimientoReporte[] =>
    datos.movimientosDelPeriodo.map((movimiento) => {
      const categoria = categorias.find((c) => c.id === movimiento.categoriaId);
      const cuenta = cuentas.find((c) => c.id === movimiento.cuentaId);
      return {
        fecha: new Date(movimiento.fechaMovimiento).toLocaleDateString(),
        tipo: t(`pantallas.movimientoNuevo.${movimiento.tipo}`),
        categoria: categoria ? nombreCategoria(categoria, t) : '',
        cuenta: cuenta?.nombre ?? '',
        descripcion: movimiento.descripcion ?? '',
        monto: formatearMoneda(movimiento.monto, moneda, idioma),
      };
    });

  const encabezadosTabla = [
    t('pantallas.movimientoNuevo.fecha'),
    t('pantallas.movimientoNuevo.tipo'),
    t('pantallas.movimientoNuevo.categoria'),
    t('pantallas.movimientoNuevo.cuenta'),
    t('pantallas.movimientoNuevo.descripcion'),
    t('pantallas.movimientoNuevo.monto'),
  ];

  const filasResumen = [
    { etiqueta: t('pantallas.reporte.saldoInicial'), valor: formatearMoneda(datos.saldoInicial, moneda, idioma) },
    { etiqueta: t('pantallas.inicio.ingresosDelMes'), valor: formatearMoneda(datos.resumen.ingresos, moneda, idioma) },
    { etiqueta: t('pantallas.inicio.gastosDelMes'), valor: formatearMoneda(datos.resumen.gastos, moneda, idioma) },
    { etiqueta: t('pantallas.inicio.ahorroNeto'), valor: formatearMoneda(datos.resumen.ahorroNeto, moneda, idioma) },
    { etiqueta: t('pantallas.reporte.saldoFinal'), valor: formatearMoneda(datos.saldoFinal, moneda, idioma) },
  ];

  const exportarCSV = async () => {
    setExportando('csv');
    try {
      const csv = generarCSV(encabezadosTabla, construirFilasMovimientos());
      await compartirArchivoTexto(csv, `mipresupuesto-${claveperiodo}.csv`, 'text/csv');
    } finally {
      setExportando(null);
    }
  };

  const exportarPDF = async () => {
    setExportando('pdf');
    try {
      const html = generarHTMLReporte({
        titulo: t('pantallas.reporte.titulo'),
        periodo: etiquetaPeriodo,
        filasResumen,
        encabezadosTabla,
        filas: construirFilasMovimientos(),
      });
      await exportarYCompartirPDF(html);
    } finally {
      setExportando(null);
    }
  };

  const compartirResumen = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const resumenTexto = `${t('pantallas.reporte.titulo')} — ${etiquetaPeriodo}\n${filasResumen
      .map((f) => `${f.etiqueta}: ${f.valor}`)
      .join('\n')}`;
    await Share.share({ message: resumenTexto });
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <BlurView
          intensity={30}
          tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
          style={estilos.encabezado}
        >
          <View>
            <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.reporte.titulo')}
            </Text>
            <Text style={[estilos.periodo, { color: tema.colores.textoSecundario }]}>{etiquetaPeriodo}</Text>
          </View>
          <Pressable onPress={() => volverOIrA(router, '/(principal)/inicio')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
            <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
          </Pressable>
        </BlurView>

        <View style={estilos.filaChips}>
          <ChipCategoria
            etiqueta={t('pantallas.reporte.periodoActual')}
            seleccionado={claveperiodo === 'mes-actual'}
            onPress={() => setClavePeriodo('mes-actual')}
          />
          <ChipCategoria
            etiqueta={t('pantallas.reporte.periodoAnterior')}
            seleccionado={claveperiodo === 'mes-anterior'}
            onPress={() => setClavePeriodo('mes-anterior')}
          />
        </View>

        {cuentas.length > 1 ? (
          <View style={estilos.filaChips}>
            <ChipCategoria
              etiqueta={t('pantallas.reporte.todasLasCuentas')}
              seleccionado={cuentaFiltroId === null}
              onPress={() => setCuentaFiltroId(null)}
            />
            {cuentas.map((cuenta) => (
              <ChipCategoria
                key={cuenta.id}
                etiqueta={cuenta.nombre}
                seleccionado={cuentaFiltroId === cuenta.id}
                onPress={() => setCuentaFiltroId(cuenta.id)}
              />
            ))}
          </View>
        ) : null}

        <TarjetaCristal>
          {filasResumen.map((fila) => (
            <View key={fila.etiqueta} style={estilos.filaResumen}>
              <Text style={{ color: tema.colores.textoSecundario, fontSize: 13 }}>{fila.etiqueta}</Text>
              <Text style={{ color: tema.colores.textoPrincipal, fontSize: 13, fontWeight: '700' }}>{fila.valor}</Text>
            </View>
          ))}
        </TarjetaCristal>

        {segmentos.length > 0 ? (
          <View style={estilos.seccion}>
            <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.analisis.gastosPorCategoria')}
            </Text>
            <GraficaCategorias segmentos={segmentos} etiquetaCentral={formatearMoneda(datos.resumen.gastos, moneda, idioma)} />
          </View>
        ) : null}

        {categoriaMayorGasto ? (
          <TarjetaRecomendacion
            titulo={t('pantallas.analisis.categoriaMayorGasto')}
            descripcion={t('pantallas.analisis.recomendacionCategoria', {
              categoria: nombreCategoria(categoriaMayorGasto.categoria, t),
              monto: formatearMoneda(categoriaMayorGasto.total, moneda, idioma),
            })}
            icono={categoriaMayorGasto.categoria.icono as NombreIcono}
            tono="atencion"
          />
        ) : null}

        <View style={estilos.seccion}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.metas.titulo')} / {t('pantallas.analisis.presupuestos')}
          </Text>
          <Text style={{ color: tema.colores.textoSecundario, fontSize: 13 }}>
            {metas.filter((m) => m.estado === 'activa').length} · {presupuestosDelPeriodo.length}
          </Text>
        </View>

        <View style={estilos.seccion}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.reporte.tablaMovimientos')}
          </Text>
          {datos.movimientosDelPeriodo.length === 0 ? (
            <EstadoVacio titulo={t('pantallas.reporte.sinMovimientosPeriodo')} icono="receipt-long" />
          ) : (
            <View style={estilos.listaMovimientos}>
              {datos.movimientosDelPeriodo.map((movimiento) => (
                <TarjetaMovimiento
                  key={movimiento.id}
                  movimiento={movimiento}
                  categoria={categorias.find((c) => c.id === movimiento.categoriaId)}
                  cuenta={cuentas.find((c) => c.id === movimiento.cuentaId)}
                  cuentaDestino={cuentas.find((c) => c.id === movimiento.cuentaDestinoId)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={estilos.filaBotones}>
          <BotonSecundario
            titulo={exportando === 'pdf' ? t('pantallas.reporte.generando') : t('pantallas.reporte.exportarPDF')}
            onPress={exportarPDF}
            deshabilitado={exportando !== null}
          />
          <BotonSecundario
            titulo={exportando === 'csv' ? t('pantallas.reporte.generando') : t('pantallas.reporte.exportarCSV')}
            onPress={exportarCSV}
            deshabilitado={exportando !== null}
          />
        </View>
        <BotonSecundario titulo={t('pantallas.reporte.compartir')} onPress={compartirResumen} />
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
    alignItems: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
  },
  periodo: {
    fontSize: 13,
    marginTop: 2,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  seccion: {
    gap: 10,
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '700',
  },
  listaMovimientos: {
    gap: 8,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 10,
  },
});
