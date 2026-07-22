import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { TarjetaMetrica } from '@/src/componentes/comunes/TarjetaMetrica';
import { TarjetaRecomendacion } from '@/src/componentes/comunes/TarjetaRecomendacion';
import { GraficaCategorias } from '@/src/componentes/graficas/GraficaCategorias';
import { GraficaIngresosGastos } from '@/src/componentes/graficas/GraficaIngresosGastos';
import { TarjetaPresupuesto } from '@/src/componentes/presupuestos/TarjetaPresupuesto';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import {
  calcularCategoriaConMayorGasto,
  calcularComparacionPeriodos,
  calcularGastosPorCategoria,
  calcularPromedioDiarioGasto,
  calcularProyeccionSaldo,
  calcularSaludFinanciera,
} from '@/src/utilidades/calculosAnalisis';
import {
  calcularResumenPeriodo,
  calcularSaldoTotal,
  filtrarMovimientosPorPeriodo,
  obtenerRangoMesAnterior,
  obtenerRangoMesActual,
} from '@/src/utilidades/calculosFinancieros';
import { calcularConsumoPresupuesto } from '@/src/utilidades/calculosPlanificacion';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';

const ICONO_SALUD: Record<'verde' | 'amarillo' | 'rojo', NombreIcono> = {
  verde: 'check-circle',
  amarillo: 'error-outline',
  rojo: 'warning',
};

function periodoActualISO(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
}

export default function PantallaAnalisis() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();
  const { cuentas, categorias, movimientos } = useFinanzas();
  const { presupuestos } = usePlanificacion();

  const moneda = cuentas[0]?.moneda ?? 'GTQ';
  const ahora = new Date();

  const { movimientosMesActual, movimientosMesAnterior, resumenActual, resumenAnterior } = useMemo(() => {
    const rangoActual = obtenerRangoMesActual(ahora);
    const rangoAnterior = obtenerRangoMesAnterior(ahora);
    const delMesActual = filtrarMovimientosPorPeriodo(movimientos, rangoActual.inicio, rangoActual.fin);
    const delMesAnterior = filtrarMovimientosPorPeriodo(movimientos, rangoAnterior.inicio, rangoAnterior.fin);
    return {
      movimientosMesActual: delMesActual,
      movimientosMesAnterior: delMesAnterior,
      resumenActual: calcularResumenPeriodo(delMesActual),
      resumenAnterior: calcularResumenPeriodo(delMesAnterior),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movimientos]);

  const comparacion = calcularComparacionPeriodos(resumenActual, resumenAnterior);
  const saludNivel = calcularSaludFinanciera(resumenActual.tasaAhorro);
  const categoriaMayorGasto = calcularCategoriaConMayorGasto(movimientosMesActual, categorias);
  const promedioDiario = calcularPromedioDiarioGasto(movimientosMesActual, ahora.getDate());
  const diasEnElMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  const saldoActual = calcularSaldoTotal(cuentas, movimientos);
  const proyeccionSaldo = calcularProyeccionSaldo(saldoActual, resumenActual.ahorroNeto, ahora.getDate(), diasEnElMes);

  const gastosPorCategoria = calcularGastosPorCategoria(movimientosMesActual);
  const segmentosGrafica = gastosPorCategoria.slice(0, 8).map((entrada) => {
    const categoria = categorias.find((c) => c.id === entrada.categoriaId);
    return {
      id: entrada.categoriaId,
      etiqueta: categoria ? nombreCategoria(categoria, t) : entrada.categoriaId,
      porcentaje: entrada.porcentaje,
      color: categoria?.color ?? tema.colores.violeta,
    };
  });

  const periodo = periodoActualISO();
  const presupuestosDelMes = presupuestos.filter((p) => p.periodo === periodo);

  const hayDatosSuficientes = movimientosMesActual.length > 0;

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('pantallas.analisis.titulo')}</Text>

        <TarjetaCristal>
          <View style={estilos.filaSalud}>
            <View style={[estilos.iconoSalud, { backgroundColor: colorSalud(tema, saludNivel) + '26' }]}>
              <Icono nombre={ICONO_SALUD[saludNivel]} tamano={22} color={colorSalud(tema, saludNivel)} />
            </View>
            <View style={estilos.textosSalud}>
              <Text style={[estilos.tituloSalud, { color: tema.colores.textoPrincipal }]}>
                {t(`pantallas.analisis.salud.${saludNivel}.titulo`)}
              </Text>
              <Text style={[estilos.descripcionSalud, { color: tema.colores.textoSecundario }]}>
                {t(`pantallas.analisis.salud.${saludNivel}.descripcion`, { tasa: resumenActual.tasaAhorro })}
              </Text>
            </View>
          </View>
        </TarjetaCristal>

        {hayDatosSuficientes ? (
          <>
            <View style={estilos.seccion}>
              <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
                {t('pantallas.analisis.comparacionMesAnterior')}
              </Text>
              <GraficaIngresosGastos ingresos={resumenActual.ingresos} gastos={resumenActual.gastos} moneda={moneda} />
              {comparacion.porcentajeVariacionGastos !== null ? (
                <Text style={{ color: tema.colores.textoSecundario, fontSize: 12 }}>
                  {t(
                    comparacion.porcentajeVariacionGastos >= 0
                      ? 'pantallas.analisis.masQueElMesPasado'
                      : 'pantallas.analisis.menosQueElMesPasado',
                    { porcentaje: Math.abs(comparacion.porcentajeVariacionGastos) }
                  )}
                </Text>
              ) : null}
            </View>

            <View style={estilos.filaMetricas}>
              <TarjetaMetrica
                etiqueta={t('pantallas.analisis.promedioDiario')}
                valor={formatearMoneda(promedioDiario, moneda, idioma)}
                icono="today"
              />
              <TarjetaMetrica
                etiqueta={t('pantallas.analisis.proyeccionSaldo')}
                valor={formatearMoneda(proyeccionSaldo, moneda, idioma)}
                icono="trending-up"
              />
            </View>

            {segmentosGrafica.length > 0 ? (
              <View style={estilos.seccion}>
                <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
                  {t('pantallas.analisis.gastosPorCategoria')}
                </Text>
                <GraficaCategorias
                  segmentos={segmentosGrafica}
                  etiquetaCentral={formatearMoneda(resumenActual.gastos, moneda, idioma)}
                />
              </View>
            ) : (
              <EstadoVacio titulo={t('pantallas.analisis.sinGastosCategoria')} icono="pie-chart" />
            )}
          </>
        ) : (
          <EstadoVacio titulo={t('pantallas.analisis.sinGastosCategoria')} icono="insights" />
        )}

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.analisis.presupuestos')}
            </Text>
            <Pressable onPress={() => router.push('/presupuesto/nuevo')} accessibilityRole="button" accessibilityLabel={t('pantallas.analisis.nuevoPresupuesto')}>
              <Icono nombre="add-circle-outline" tamano={22} color={tema.colores.violeta} />
            </Pressable>
          </View>
          {presupuestosDelMes.length === 0 ? (
            <EstadoVacio titulo={t('pantallas.analisis.sinPresupuestos')} icono="account-balance-wallet" />
          ) : (
            <View style={estilos.listaPresupuestos}>
              {presupuestosDelMes.map((presupuesto) => {
                const categoria = categorias.find((c) => c.id === presupuesto.categoriaId);
                const movimientosCategoria = movimientosMesActual.filter((m) => m.categoriaId === presupuesto.categoriaId);
                const consumo = calcularConsumoPresupuesto(presupuesto, movimientosCategoria);
                return (
                  <TarjetaPresupuesto key={presupuesto.id} categoria={categoria} consumo={consumo} moneda={moneda} />
                );
              })}
            </View>
          )}
        </View>

        <View style={estilos.seccion}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.analisis.recomendaciones')}
          </Text>
          {categoriaMayorGasto ? (
            <>
              <TarjetaRecomendacion
                titulo={nombreCategoria(categoriaMayorGasto.categoria, t)}
                descripcion={t('pantallas.analisis.recomendacionCategoria', {
                  categoria: nombreCategoria(categoriaMayorGasto.categoria, t),
                  monto: formatearMoneda(categoriaMayorGasto.total, moneda, idioma),
                })}
                icono={categoriaMayorGasto.categoria.icono as NombreIcono}
                tono="atencion"
              />
              <TarjetaRecomendacion
                titulo={t('pantallas.analisis.gastosPorCategoria')}
                descripcion={t('pantallas.analisis.recomendacionAhorro', {
                  categoria: nombreCategoria(categoriaMayorGasto.categoria, t),
                  monto: formatearMoneda(categoriaMayorGasto.total * 0.25, moneda, idioma),
                })}
                icono="savings"
                tono="positivo"
              />
            </>
          ) : (
            <TarjetaRecomendacion
              titulo={t('pantallas.analisis.recomendaciones')}
              descripcion={t('pantallas.analisis.sinRecomendaciones')}
              icono="lightbulb"
            />
          )}
        </View>
      </View>
    </LayoutResponsive>
  );
}

function colorSalud(tema: ReturnType<typeof useTema>['tema'], nivel: 'verde' | 'amarillo' | 'rojo'): string {
  if (nivel === 'verde') return tema.colores.ingreso;
  if (nivel === 'amarillo') return tema.colores.advertencia;
  return tema.colores.gasto;
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  filaSalud: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconoSalud: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textosSalud: {
    flex: 1,
    gap: 4,
  },
  tituloSalud: {
    fontSize: 15,
    fontWeight: '700',
  },
  descripcionSalud: {
    fontSize: 13,
    lineHeight: 18,
  },
  seccion: {
    gap: 10,
  },
  encabezadoSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '700',
  },
  filaMetricas: {
    flexDirection: 'row',
    gap: 12,
  },
  listaPresupuestos: {
    gap: 10,
  },
});
