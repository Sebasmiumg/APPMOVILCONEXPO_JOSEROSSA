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

export async function listarPendientes(db: SQLiteDatabase): Promise<EntradaColaSincronizacion[]> {
  const filas = await db.getAllAsync<FilaColaSincronizacionSQL>(
    'SELECT * FROM cola_sincronizacion WHERE sincronizado = 0 ORDER BY creado_en ASC'
  );
  return filas.map(mapearFilaColaSincronizacion);
}

export async function contarPendientes(db: SQLiteDatabase): Promise<number> {
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM cola_sincronizacion WHERE sincronizado = 0'
  );
  return fila?.total ?? 0;
}

export async function marcarSincronizado(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE cola_sincronizacion SET sincronizado = 1 WHERE id = ?', [id]);
}

export async function incrementarIntentos(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE cola_sincronizacion SET intentos = intentos + 1 WHERE id = ?', [id]);
}
