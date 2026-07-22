import type { TFunction } from 'i18next';

import type { Categoria } from '@/src/tipos/categoria';
import type { Cuenta } from '@/src/tipos/cuenta';
import type { CodigoMoneda } from '@/src/tipos/finanzas';
import type { Meta } from '@/src/tipos/meta';
import type { Movimiento } from '@/src/tipos/movimiento';
import type { CodigoIdioma } from '@/src/idiomas/configuracionIdioma';
import type { Intencion } from '@/src/servicios/asistente/detectorIntencion';
import {
  calcularCategoriaConMayorGasto,
  calcularComparacionPeriodos,
  calcularGastosPorCategoria,
} from '@/src/utilidades/calculosAnalisis';
import {
  calcularResumenPeriodo,
  filtrarMovimientosPorPeriodo,
  obtenerRangoMesActual,
  obtenerRangoMesAnterior,
} from '@/src/utilidades/calculosFinancieros';
import { calcularAhorroSugeridoMeta, calcularProgresoMeta } from '@/src/utilidades/calculosPlanificacion';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';

export interface ContextoAsistente {
  movimientos: Movimiento[];
  categorias: Categoria[];
  cuentas: Cuenta[];
  metas: Meta[];
  moneda: CodigoMoneda;
  idioma: CodigoIdioma;
}

export interface RespuestaLocal {
  texto: string;
  datosUtilizados: string;
}

export function generarRespuesta(intencion: Intencion, contexto: ContextoAsistente, t: TFunction): RespuestaLocal {
  const { movimientos, categorias, metas, moneda, idioma } = contexto;
  const dinero = (monto: number) => formatearMoneda(monto, moneda, idioma);

  switch (intencion.tipo) {
    case 'gastoPeriodo':
    case 'ingresoPeriodo': {
      const rango = intencion.rango ?? obtenerRangoMesActual();
      const delPeriodo = filtrarMovimientosPorPeriodo(movimientos, rango.inicio, rango.fin);
      const resumen = calcularResumenPeriodo(delPeriodo);
      const monto = intencion.tipo === 'gastoPeriodo' ? resumen.gastos : resumen.ingresos;
      const etiquetaPeriodo = intencion.rango?.etiqueta ?? t('pantallas.asistente.periodoMesActual');
      return {
        texto: t(
          intencion.tipo === 'gastoPeriodo' ? 'pantallas.asistente.respuestas.gastoMes' : 'pantallas.asistente.respuestas.ingresoMes',
          { monto: dinero(monto), periodo: etiquetaPeriodo }
        ),
        datosUtilizados: t('pantallas.asistente.datosUtilizadosPeriodo', { periodo: etiquetaPeriodo }),
      };
    }

    case 'categoriaMayorGasto': {
      const rango = obtenerRangoMesActual();
      const delMes = filtrarMovimientosPorPeriodo(movimientos, rango.inicio, rango.fin);
      const resultado = calcularCategoriaConMayorGasto(delMes, categorias);
      if (!resultado) {
        return {
          texto: t('pantallas.asistente.respuestas.categoriaMayorGastoSinDatos'),
          datosUtilizados: t('pantallas.asistente.datosUtilizadosMesActual'),
        };
      }
      return {
        texto: t('pantallas.asistente.respuestas.categoriaMayorGasto', {
          categoria: nombreCategoria(resultado.categoria, t),
          monto: dinero(resultado.total),
        }),
        datosUtilizados: t('pantallas.asistente.datosUtilizadosMesActual'),
      };
    }

    case 'sugerenciaReduccion': {
      const rango = obtenerRangoMesActual();
      const delMes = filtrarMovimientosPorPeriodo(movimientos, rango.inicio, rango.fin);
      const [primero] = calcularGastosPorCategoria(delMes);
      if (!primero) {
        return {
          texto: t('pantallas.asistente.respuestas.sugerenciaReduccionSinDatos'),
          datosUtilizados: t('pantallas.asistente.datosUtilizadosMesActual'),
        };
      }
      const categoria = categorias.find((c) => c.id === primero.categoriaId);
      return {
        texto: t('pantallas.asistente.respuestas.sugerenciaReduccion', {
          categoria: categoria ? nombreCategoria(categoria, t) : '',
          monto: dinero(primero.total),
          porcentaje: primero.porcentaje,
        }),
        datosUtilizados: t('pantallas.asistente.datosUtilizadosMesActual'),
      };
    }

    case 'comparacionMesAnterior': {
      const actual = calcularResumenPeriodo(filtrarMovimientosPorPeriodo(movimientos, obtenerRangoMesActual().inicio, obtenerRangoMesActual().fin));
      const rangoAnterior = obtenerRangoMesAnterior();
      const movimientosAnterior = filtrarMovimientosPorPeriodo(movimientos, rangoAnterior.inicio, rangoAnterior.fin);
      if (movimientosAnterior.length === 0) {
        return {
          texto: t('pantallas.asistente.respuestas.comparacionSinDatosAnterior'),
          datosUtilizados: t('pantallas.asistente.datosUtilizadosDosMeses'),
        };
      }
      const anterior = calcularResumenPeriodo(movimientosAnterior);
      const comparacion = calcularComparacionPeriodos(actual, anterior);
      const clave =
        comparacion.variacionGastos >= 0
          ? 'pantallas.asistente.respuestas.comparacionMas'
          : 'pantallas.asistente.respuestas.comparacionMenos';
      return {
        texto: t(clave, {
          porcentaje: Math.abs(comparacion.porcentajeVariacionGastos ?? 0),
          montoActual: dinero(actual.gastos),
          montoAnterior: dinero(anterior.gastos),
        }),
        datosUtilizados: t('pantallas.asistente.datosUtilizadosDosMeses'),
      };
    }

    case 'ahorroTotal': {
      const rango = obtenerRangoMesActual();
      const resumen = calcularResumenPeriodo(filtrarMovimientosPorPeriodo(movimientos, rango.inicio, rango.fin));
      return {
        texto: t('pantallas.asistente.respuestas.ahorroTotal', { monto: dinero(resumen.ahorroNeto), tasa: resumen.tasaAhorro }),
        datosUtilizados: t('pantallas.asistente.datosUtilizadosMesActual'),
      };
    }

    case 'progresoMeta': {
      const activas = metas.filter((m) => m.estado === 'activa');
      if (activas.length === 0) {
        return {
          texto: t('pantallas.asistente.respuestas.progresoMetaSinMetas'),
          datosUtilizados: t('pantallas.asistente.datosUtilizadosMetas'),
        };
      }
      if (activas.length > 1) {
        return {
          texto: t('pantallas.asistente.respuestas.progresoMetaVarias', { cantidad: activas.length }),
          datosUtilizados: t('pantallas.asistente.datosUtilizadosMetas'),
        };
      }
      const meta = activas[0];
      const progreso = calcularProgresoMeta(meta);
      const sugerido = calcularAhorroSugeridoMeta(meta);
      let texto = t('pantallas.asistente.respuestas.progresoMetaUna', {
        nombre: meta.nombre,
        porcentaje: progreso.porcentaje,
        restante: dinero(progreso.restante),
      });
      if (sugerido.porSemana !== null) {
        texto += ` ${t('pantallas.asistente.respuestas.progresoMetaSugerido', { monto: dinero(sugerido.porSemana) })}`;
      }
      return { texto, datosUtilizados: t('pantallas.asistente.datosUtilizadosMetas') };
    }

    case 'ultimosMovimientos': {
      let filtrados = intencion.filtroTipo ? movimientos.filter((m) => m.tipo === intencion.filtroTipo) : movimientos;
      filtrados = filtrados.slice(0, intencion.cantidad);
      if (filtrados.length === 0) {
        return {
          texto: t('pantallas.asistente.respuestas.ultimosMovimientosSinDatos'),
          datosUtilizados: t('pantallas.asistente.datosUtilizadosMovimientos'),
        };
      }
      const lineas = filtrados.map((movimiento) => {
        const categoria = categorias.find((c) => c.id === movimiento.categoriaId);
        const etiqueta = movimiento.descripcion?.trim() || (categoria ? nombreCategoria(categoria, t) : movimiento.tipo);
        const signo = movimiento.tipo === 'gasto' ? '-' : movimiento.tipo === 'ingreso' ? '+' : '';
        const fecha = new Date(movimiento.fechaMovimiento).toLocaleDateString();
        return `• ${etiqueta}: ${signo}${dinero(movimiento.monto)} (${fecha})`;
      });
      const encabezado = t('pantallas.asistente.respuestas.ultimosMovimientosEncabezado', { cantidad: filtrados.length });
      return { texto: `${encabezado}\n${lineas.join('\n')}`, datosUtilizados: t('pantallas.asistente.datosUtilizadosMovimientos') };
    }

    case 'noEntendido':
    default:
      return { texto: t('pantallas.asistente.respuestas.noEntendido'), datosUtilizados: '' };
  }
}
