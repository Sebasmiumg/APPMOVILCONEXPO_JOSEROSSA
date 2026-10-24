import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { encolarCambio } from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';
import {
  type AporteMeta,
  type EstadoMeta,
  type FilaAporteMetaSQL,
  type FilaMetaSQL,
  mapearFilaAporteMeta,
  mapearFilaMeta,
  type Meta,
} from '@/src/tipos/meta';

export interface DatosNuevaMeta {
  nombre: string;
  montoObjetivo: number;
  montoActual?: number;
  cuentaId?: string | null;
  fechaObjetivo?: string | null;
}

export async function listarMetas(db: SQLiteDatabase, estado?: EstadoMeta): Promise<Meta[]> {
  const filas = estado
    ? await db.getAllAsync<FilaMetaSQL>('SELECT * FROM metas WHERE estado = ? ORDER BY creada_en DESC', [estado])
    : await db.getAllAsync<FilaMetaSQL>("SELECT * FROM metas WHERE estado != 'archivada' ORDER BY creada_en DESC");
  return filas.map(mapearFilaMeta);
}

export async function crearMeta(db: SQLiteDatabase, datos: DatosNuevaMeta): Promise<Meta> {
  const id = Crypto.randomUUID();
  const ahora = new Date().toISOString();
  const montoActual = datos.montoActual ?? 0;
  await db.runAsync(
    `INSERT INTO metas (id, cuenta_id, nombre, monto_objetivo, monto_actual, fecha_objetivo, estado, creada_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, 'activa', ?, ?)`,
    [id, datos.cuentaId ?? null, datos.nombre, datos.montoObjetivo, montoActual, datos.fechaObjetivo ?? null, ahora, ahora]
  );

  await encolarCambio(db, 'metas', id, 'insertar', {
    cuenta_id: datos.cuentaId ?? null,
    nombre: datos.nombre,
    monto_objetivo: datos.montoObjetivo,
    monto_actual: montoActual,
    fecha_objetivo: datos.fechaObjetivo ?? null,
    estado: 'activa',
    creada_en: ahora,
    actualizado_en: ahora,
  });

  return {
    id,
    cuentaId: datos.cuentaId ?? null,
    nombre: datos.nombre,
    montoObjetivo: datos.montoObjetivo,
    montoActual,
    fechaObjetivo: datos.fechaObjetivo ?? null,
    estado: 'activa',
    creadaEn: ahora,
  };
}

export async function agregarAporteMeta(
  db: SQLiteDatabase,
  metaId: string,
  monto: number,
  nota?: string | null
): Promise<AporteMeta> {
  const id = Crypto.randomUUID();
  const fecha = new Date().toISOString();
  let metaActualizada: FilaMetaSQL | null = null;

  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT INTO aportes_meta (id, meta_id, monto, fecha, nota) VALUES (?, ?, ?, ?, ?)', [
      id,
      metaId,
      monto,
      fecha,
      nota ?? null,
    ]);
    // ROUND(...,2): sin esto, sumas sucesivas de REAL (float) en SQLite
    // acumulan error de punto flotante (ej. 16.65+16.65+16.70 puede quedar en
    // 49.999999999999993), e impiden que monto_actual >= monto_objetivo se
    // cumpla aunque el total mostrado ya sea exactamente el objetivo.
    await db.runAsync('UPDATE metas SET monto_actual = ROUND(monto_actual + ?, 2), actualizado_en = ? WHERE id = ?', [
      monto,
      fecha,
      metaId,
    ]);
    const meta = await db.getFirstAsync<FilaMetaSQL>('SELECT * FROM metas WHERE id = ?', [metaId]);
    if (meta && meta.monto_actual >= meta.monto_objetivo) {
      await db.runAsync("UPDATE metas SET estado = 'completada' WHERE id = ?", [metaId]);
      meta.estado = 'completada';
    }
    metaActualizada = meta;
  });

  await encolarCambio(db, 'aportes_meta', id, 'insertar', { meta_id: metaId, monto, fecha, nota: nota ?? null });
  if (metaActualizada) {
    const meta = metaActualizada as FilaMetaSQL;
    await encolarCambio(db, 'metas', metaId, 'actualizar', {
      monto_actual: meta.monto_actual,
      estado: meta.estado,
      actualizado_en: fecha,
    });
  }

  return { id, metaId, monto, fecha, nota: nota ?? null };
}

// Corrige el progreso de la meta a un monto exacto (a diferencia de
// agregarAporteMeta, que solo suma). Útil cuando el usuario ya tenía ahorrado
// algo antes de registrar aportes, o quiere corregir un error.
export async function actualizarProgresoMeta(db: SQLiteDatabase, metaId: string, montoActual: number): Promise<Meta> {
  const fecha = new Date().toISOString();
  let filaActualizada: FilaMetaSQL | null = null;

  await db.withTransactionAsync(async () => {
    const meta = await db.getFirstAsync<FilaMetaSQL>('SELECT * FROM metas WHERE id = ?', [metaId]);
    if (!meta) return;
    const nuevoEstado = meta.estado === 'archivada' ? 'archivada' : montoActual >= meta.monto_objetivo ? 'completada' : 'activa';
    await db.runAsync('UPDATE metas SET monto_actual = ROUND(?, 2), estado = ?, actualizado_en = ? WHERE id = ?', [
      montoActual,
      nuevoEstado,
      fecha,
      metaId,
    ]);
    filaActualizada = { ...meta, monto_actual: montoActual, estado: nuevoEstado };
  });

  if (!filaActualizada) {
    throw new Error(`Meta ${metaId} no encontrada`);
  }

  const meta = filaActualizada as FilaMetaSQL;
  await encolarCambio(db, 'metas', metaId, 'actualizar', {
    monto_actual: meta.monto_actual,
    estado: meta.estado,
    actualizado_en: fecha,
  });

  return mapearFilaMeta(meta);
}

export async function listarAportesMeta(db: SQLiteDatabase, metaId: string): Promise<AporteMeta[]> {
  const filas = await db.getAllAsync<FilaAporteMetaSQL>(
    'SELECT * FROM aportes_meta WHERE meta_id = ? ORDER BY fecha DESC',
    [metaId]
  );
  return filas.map(mapearFilaAporteMeta);
}

export async function archivarMeta(db: SQLiteDatabase, id: string): Promise<void> {
  const ahora = new Date().toISOString();
  await db.runAsync("UPDATE metas SET estado = 'archivada', actualizado_en = ? WHERE id = ?", [ahora, id]);
  await encolarCambio(db, 'metas', id, 'actualizar', { estado: 'archivada', actualizado_en: ahora });
}
