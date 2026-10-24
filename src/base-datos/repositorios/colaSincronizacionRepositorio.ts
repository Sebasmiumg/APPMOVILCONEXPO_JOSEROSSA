import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  type EntradaColaSincronizacion,
  type FilaColaSincronizacionSQL,
  mapearFilaColaSincronizacion,
  type OperacionSincronizacion,
  type TablaSincronizable,
} from '@/src/tipos/colaSincronizacion';

export async function encolarCambio(
  db: SQLiteDatabase,
  tabla: TablaSincronizable,
  registroId: string,
  operacion: OperacionSincronizacion,
  payload: Record<string, unknown> | null
): Promise<void> {
  await db.runAsync(
    `INSERT INTO cola_sincronizacion (id, tabla, registro_id, operacion, payload, creado_en, sincronizado, intentos)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
    [Crypto.randomUUID(), tabla, registroId, operacion, payload ? JSON.stringify(payload) : null, new Date().toISOString()]
  );
}

// Debe coincidir con INTENTOS_MAXIMOS en sincronizador.ts: a partir de ese
// número de fallos, una entrada se considera abandonada (ver contarFallidos).
export const INTENTOS_MAXIMOS = 5;

export async function listarPendientes(db: SQLiteDatabase): Promise<EntradaColaSincronizacion[]> {
  const filas = await db.getAllAsync<FilaColaSincronizacionSQL>(
    'SELECT * FROM cola_sincronizacion WHERE sincronizado = 0 AND intentos < ? ORDER BY creado_en ASC',
    [INTENTOS_MAXIMOS]
  );
  return filas.map(mapearFilaColaSincronizacion);
}

// Pendientes que todavía se van a reintentar. No incluye las entradas que ya
// agotaron sus intentos (ver contarFallidos) para no mostrar un contador
// "pendiente" que en realidad nunca se va a mover.
export async function contarPendientes(db: SQLiteDatabase): Promise<number> {
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM cola_sincronizacion WHERE sincronizado = 0 AND intentos < ?',
    [INTENTOS_MAXIMOS]
  );
  return fila?.total ?? 0;
}

// Cambios que agotaron sus reintentos y nunca llegaron a Supabase: se
// abandonaron en silencio si nadie los muestra en la interfaz.
export async function contarFallidos(db: SQLiteDatabase): Promise<number> {
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM cola_sincronizacion WHERE sincronizado = 0 AND intentos >= ?',
    [INTENTOS_MAXIMOS]
  );
  return fila?.total ?? 0;
}

export async function marcarSincronizado(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE cola_sincronizacion SET sincronizado = 1 WHERE id = ?', [id]);
}

export async function incrementarIntentos(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE cola_sincronizacion SET intentos = intentos + 1 WHERE id = ?', [id]);
}

// Un reintento manual vuelve a poner en cola los cambios agotados. Las entradas
// solo se marcan como sincronizadas cuando Supabase confirma la operación.
export async function reabrirFallidos(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    'UPDATE cola_sincronizacion SET intentos = 0 WHERE sincronizado = 0 AND intentos >= ?',
    [INTENTOS_MAXIMOS]
  );
}

// Sin esto la tabla crece para siempre: cada mutación local encola una fila
// y marcarSincronizado solo la marca, nunca la borra.
export async function purgarSincronizados(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM cola_sincronizacion WHERE sincronizado = 1');
}
