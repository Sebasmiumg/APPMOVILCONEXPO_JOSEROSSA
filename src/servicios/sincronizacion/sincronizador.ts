import type { SQLiteDatabase } from 'expo-sqlite';

import {
  contarPendientes,
  incrementarIntentos,
  listarPendientes,
  marcarSincronizado,
} from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';
import { supabase, supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import type { EntradaColaSincronizacion, TablaSincronizable } from '@/src/tipos/colaSincronizacion';

const INTENTOS_MAXIMOS = 5;

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

export { contarPendientes };

export async function sincronizarCambiosPendientes(db: SQLiteDatabase, usuarioId: string): Promise<ResultadoSincronizacion> {
  if (!supabaseEstaConfigurado() || !supabase) {
    return { intentados: 0, exitosos: 0, fallidos: 0 };
  }

  const pendientes = await listarPendientes(db);
  let exitosos = 0;
  let fallidos = 0;

  for (const entrada of pendientes) {
    if (entrada.intentos >= INTENTOS_MAXIMOS) continue;
    try {
      await aplicarCambioRemoto(entrada, usuarioId);
      await marcarSincronizado(db, entrada.id);
      exitosos += 1;
    } catch {
      await incrementarIntentos(db, entrada.id);
      fallidos += 1;
    }
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

  const { error } = await supabase.from(entrada.tabla).upsert(payload);
  if (error) throw new Error(error.message);
}
