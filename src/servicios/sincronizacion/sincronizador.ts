import type { SQLiteDatabase } from 'expo-sqlite';

import {
  contarFallidos,
  contarPendientes,
  incrementarIntentos,
  listarPendientes,
  marcarSincronizado,
  purgarSincronizados,
} from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';
import { supabase, supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import type { EntradaColaSincronizacion, TablaSincronizable } from '@/src/tipos/colaSincronizacion';

// Tablas cuyas filas en Supabase incluyen la columna usuario_id (todas excepto
// aportes_meta, cuya pertenencia se resuelve mediante metas.usuario_id — ver
// supabase/migrations/0001_esquema_inicial.sql).
const TABLAS_CON_USUARIO: ReadonlySet<TablaSincronizable> = new Set([
  'cuentas',
  'categorias',
  'movimientos',
  'presupuestos',
  'metas',
]);

export interface ResultadoSincronizacion {
  intentados: number;
  exitosos: number;
  fallidos: number;
}

export { contarFallidos, contarPendientes };

// Evita que dos sincronizaciones corran en paralelo (se dispara tras cada
// mutación local y también manualmente desde "Sincronizar ahora"): sin esto,
// dos corridas superpuestas pueden leer las mismas filas pendientes antes de
// que ninguna las marque, duplicando envíos y quemando reintentos al doble.
let sincronizacionEnCurso: Promise<ResultadoSincronizacion> | null = null;

export function sincronizarCambiosPendientes(db: SQLiteDatabase, usuarioId: string): Promise<ResultadoSincronizacion> {
  if (sincronizacionEnCurso) return sincronizacionEnCurso;

  const ejecucion = ejecutarSincronizacion(db, usuarioId).finally(() => {
    sincronizacionEnCurso = null;
  });
  sincronizacionEnCurso = ejecucion;
  return ejecucion;
}

async function ejecutarSincronizacion(db: SQLiteDatabase, usuarioId: string): Promise<ResultadoSincronizacion> {
  if (!supabaseEstaConfigurado() || !supabase) {
    return { intentados: 0, exitosos: 0, fallidos: 0 };
  }

  const pendientes = await listarPendientes(db);
  let exitosos = 0;
  let fallidos = 0;

  for (const entrada of pendientes) {
    try {
      await aplicarCambioRemoto(entrada, usuarioId);
      await marcarSincronizado(db, entrada.id);
      exitosos += 1;
    } catch {
      await incrementarIntentos(db, entrada.id);
      fallidos += 1;
    }
  }

  if (exitosos > 0) {
    await purgarSincronizados(db);
  }

  return { intentados: pendientes.length, exitosos, fallidos };
}

// Disparo "en segundo plano" usado tras cada mutación local y al iniciar sesión:
// no bloquea la interfaz y los fallos simplemente quedan pendientes en la cola
// para el siguiente intento (ver §24 del prompt maestro: cola de sincronización).
export function dispararSincronizacionEnSegundoPlano(db: SQLiteDatabase, usuarioId: string | undefined): void {
  if (!usuarioId) return;
  sincronizarCambiosPendientes(db, usuarioId).catch(() => {});
}

async function aplicarCambioRemoto(entrada: EntradaColaSincronizacion, usuarioId: string): Promise<void> {
  if (!supabase) return;

  if (entrada.operacion === 'eliminar') {
    const { error } = await supabase.from(entrada.tabla).delete().eq('id', entrada.registroId);
    if (error) throw new Error(error.message);
    return;
  }

  const payload: Record<string, unknown> = { ...entrada.payload, id: entrada.registroId };
  if (TABLAS_CON_USUARIO.has(entrada.tabla)) {
    payload.usuario_id = usuarioId;
  }

  // Updates are patches from the local queue and therefore omit required
  // insert columns (for example cuenta_id on movimientos). PostgreSQL can
  // reject a partial upsert before it reaches ON CONFLICT, so use UPDATE for
  // patches and verify that RLS allowed a matching row.
  if (entrada.operacion === 'actualizar') {
    const { data, error } = await supabase
      .from(entrada.tabla)
      .update(payload)
      .eq('id', entrada.registroId)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`No se encontró el registro propio ${entrada.tabla}/${entrada.registroId}`);
    return;
  }

  const { error } = await supabase.from(entrada.tabla).upsert(payload);
  if (error) throw new Error(error.message);
}
