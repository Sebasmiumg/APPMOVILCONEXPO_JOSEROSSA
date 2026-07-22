import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TFunction } from 'i18next';

import { guardarPreferencia, obtenerPreferencia } from '@/src/almacenamiento/preferenciasDispositivo';
import type { Presupuesto } from '@/src/tipos/presupuesto';
import { calcularConsumoPresupuesto } from '@/src/utilidades/calculosPlanificacion';
import type { Movimiento } from '@/src/tipos/movimiento';

// expo-notifications no está disponible en web (ver AGENTS.md: SDK 54); en esa
// plataforma esta función se comporta como no-op, igual que el resto de funciones
// nativas opcionales de la app (patrón de degradación elegante ya usado con Supabase).
export const NOTIFICACIONES_SOPORTADAS = Platform.OS === 'ios' || Platform.OS === 'android';

export async function permisoNotificacionesConcedido(): Promise<boolean> {
  if (!NOTIFICACIONES_SOPORTADAS) return false;
  const permiso = await Notifications.getPermissionsAsync();
  return permiso.granted;
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (!NOTIFICACIONES_SOPORTADAS) return false;
  const permiso = await Notifications.requestPermissionsAsync();
  return permiso.granted;
}

if (NOTIFICACIONES_SOPORTADAS) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const PREFIJO_CLAVE_NOTIFICADO = 'alerta_presupuesto_';

async function yaSeNotifico(presupuestoId: string, periodo: string, estado: 'advertencia' | 'excedido'): Promise<boolean> {
  const valor = await obtenerPreferencia(`${PREFIJO_CLAVE_NOTIFICADO}${presupuestoId}_${periodo}_${estado}`);
  return valor === 'true';
}

async function marcarNotificado(presupuestoId: string, periodo: string, estado: 'advertencia' | 'excedido'): Promise<void> {
  await guardarPreferencia(`${PREFIJO_CLAVE_NOTIFICADO}${presupuestoId}_${periodo}_${estado}`, 'true');
}

// Revisa los presupuestos afectados por la categoría de un movimiento recién creado o
// editado y, si alguno cruzó su umbral de alerta o su límite por primera vez en este
// período, dispara una notificación local (nunca remota: todo ocurre en el dispositivo).
export async function notificarSiExcedePresupuesto(
  presupuestos: readonly Presupuesto[],
  movimientos: readonly Movimiento[],
  categoriaId: string | null,
  nombreCategoria: string,
  t: TFunction
): Promise<void> {
  if (!NOTIFICACIONES_SOPORTADAS || !categoriaId) return;

  const periodoActual = new Date().toISOString().slice(0, 7);
  const presupuesto = presupuestos.find((p) => p.categoriaId === categoriaId && p.periodo === periodoActual);
  if (!presupuesto) return;

  const movimientosCategoria = movimientos.filter((m) => m.categoriaId === categoriaId && m.fechaMovimiento.slice(0, 7) === periodoActual);
  const consumo = calcularConsumoPresupuesto(presupuesto, movimientosCategoria);
  if (consumo.estado === 'normal') return;

  const yaNotificado = await yaSeNotifico(presupuesto.id, periodoActual, consumo.estado);
  if (yaNotificado) return;

  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return;

  const esExcedido = consumo.estado === 'excedido';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t(esExcedido ? 'notificaciones.presupuestoExcedidoTitulo' : 'notificaciones.presupuestoAdvertenciaTitulo'),
      body: t(esExcedido ? 'notificaciones.presupuestoExcedidoCuerpo' : 'notificaciones.presupuestoAdvertenciaCuerpo', {
        categoria: nombreCategoria,
        porcentaje: consumo.porcentaje,
      }),
    },
    trigger: null,
  });

  await marcarNotificado(presupuesto.id, periodoActual, consumo.estado);
}

export async function notificarMovimientoRecurrente(descripcion: string, montoFormateado: string, t: TFunction): Promise<void> {
  if (!NOTIFICACIONES_SOPORTADAS) return;
  const permiso = await Notifications.getPermissionsAsync();
  if (!permiso.granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: t('notificaciones.movimientoRecurrenteTitulo'),
      body: t('notificaciones.movimientoRecurrenteCuerpo', { descripcion, monto: montoFormateado }),
    },
    trigger: null,
  });
}
