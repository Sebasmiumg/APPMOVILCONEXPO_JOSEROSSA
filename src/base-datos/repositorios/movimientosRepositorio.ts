import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { encolarCambio } from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';
import { type FilaMovimientoSQL, mapearFilaMovimiento, type Movimiento, type TipoMovimiento } from '@/src/tipos/movimiento';

export interface FiltrosMovimientos {
  cuentaId?: string;
  tipo?: TipoMovimiento;
  categoriaId?: string;
  desde?: string;
  hasta?: string;
  busqueda?: string;
  limite?: number;
}

export interface DatosNuevoMovimiento {
  cuentaId: string;
  tipo: 'ingreso' | 'gasto' | 'ajuste';
  monto: number;
  categoriaId?: string | null;
  descripcion?: string | null;
  notas?: string | null;
  fechaMovimiento: string;
  comprobanteUrl?: string | null;
  recurrente?: boolean;
}

export interface DatosNuevaTransferencia {
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  monto: number;
  descripcion?: string | null;
  notas?: string | null;
  fechaMovimiento: string;
}

export async function listarMovimientos(db: SQLiteDatabase, filtros: FiltrosMovimientos = {}): Promise<Movimiento[]> {
  const condiciones: string[] = [];
  const parametros: (string | number)[] = [];

  if (filtros.cuentaId) {
    condiciones.push('(cuenta_id = ? OR cuenta_destino_id = ?)');
    parametros.push(filtros.cuentaId, filtros.cuentaId);
  }
  if (filtros.tipo) {
    condiciones.push('tipo = ?');
    parametros.push(filtros.tipo);
  }
  if (filtros.categoriaId) {
    condiciones.push('categoria_id = ?');
    parametros.push(filtros.categoriaId);
  }
  if (filtros.desde) {
    condiciones.push('fecha_movimiento >= ?');
    parametros.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push('fecha_movimiento <= ?');
    parametros.push(filtros.hasta);
  }
  if (filtros.busqueda) {
    condiciones.push('(descripcion LIKE ? OR notas LIKE ?)');
    const comodin = `%${filtros.busqueda}%`;
    parametros.push(comodin, comodin);
  }

  const clausulaWhere = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const clausulaLimite = filtros.limite ? `LIMIT ${Number(filtros.limite)}` : '';

  const filas = await db.getAllAsync<FilaMovimientoSQL>(
    `SELECT * FROM movimientos ${clausulaWhere} ORDER BY fecha_movimiento DESC, creado_en DESC ${clausulaLimite}`,
    parametros
  );
  return filas.map(mapearFilaMovimiento);
}

export async function obtenerMovimiento(db: SQLiteDatabase, id: string): Promise<Movimiento | null> {
  const fila = await db.getFirstAsync<FilaMovimientoSQL>('SELECT * FROM movimientos WHERE id = ?', [id]);
  return fila ? mapearFilaMovimiento(fila) : null;
}

export async function crearMovimiento(db: SQLiteDatabase, datos: DatosNuevoMovimiento): Promise<Movimiento> {
  const id = Crypto.randomUUID();
  const ahora = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO movimientos (
       id, cuenta_id, cuenta_destino_id, movimiento_relacionado_id, tipo, monto,
       categoria_id, descripcion, notas, fecha_movimiento, comprobante_url, recurrente, creado_en, actualizado_en
     ) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      datos.cuentaId,
      datos.tipo,
      datos.monto,
      datos.categoriaId ?? null,
      datos.descripcion ?? null,
      datos.notas ?? null,
      datos.fechaMovimiento,
      datos.comprobanteUrl ?? null,
      datos.recurrente ? 1 : 0,
      ahora,
      ahora,
    ]
  );

  await encolarCambio(db, 'movimientos', id, 'insertar', {
    cuenta_id: datos.cuentaId,
    cuenta_destino_id: null,
    movimiento_relacionado_id: null,
    tipo: datos.tipo,
    monto: datos.monto,
    categoria_id: datos.categoriaId ?? null,
    descripcion: datos.descripcion ?? null,
    notas: datos.notas ?? null,
    fecha_movimiento: datos.fechaMovimiento,
    comprobante_url: datos.comprobanteUrl ?? null,
    recurrente: Boolean(datos.recurrente),
    creado_en: ahora,
    actualizado_en: ahora,
  });

  return {
    id,
    cuentaId: datos.cuentaId,
    cuentaDestinoId: null,
    movimientoRelacionadoId: null,
    tipo: datos.tipo,
    monto: datos.monto,
    categoriaId: datos.categoriaId ?? null,
    descripcion: datos.descripcion ?? null,
    notas: datos.notas ?? null,
    fechaMovimiento: datos.fechaMovimiento,
    comprobanteUrl: datos.comprobanteUrl ?? null,
    recurrente: Boolean(datos.recurrente),
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
}

export async function crearTransferencia(db: SQLiteDatabase, datos: DatosNuevaTransferencia): Promise<Movimiento> {
  const id = Crypto.randomUUID();
  const ahora = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO movimientos (
       id, cuenta_id, cuenta_destino_id, movimiento_relacionado_id, tipo, monto,
       categoria_id, descripcion, notas, fecha_movimiento, comprobante_url, recurrente, creado_en, actualizado_en
     ) VALUES (?, ?, ?, NULL, 'transferencia', ?, NULL, ?, ?, ?, NULL, 0, ?, ?)`,
    [
      id,
      datos.cuentaOrigenId,
      datos.cuentaDestinoId,
      datos.monto,
      datos.descripcion ?? null,
      datos.notas ?? null,
      datos.fechaMovimiento,
      ahora,
      ahora,
    ]
  );

  await encolarCambio(db, 'movimientos', id, 'insertar', {
    cuenta_id: datos.cuentaOrigenId,
    cuenta_destino_id: datos.cuentaDestinoId,
    movimiento_relacionado_id: null,
    tipo: 'transferencia',
    monto: datos.monto,
    categoria_id: null,
    descripcion: datos.descripcion ?? null,
    notas: datos.notas ?? null,
    fecha_movimiento: datos.fechaMovimiento,
    comprobante_url: null,
    recurrente: false,
    creado_en: ahora,
    actualizado_en: ahora,
  });

  return {
    id,
    cuentaId: datos.cuentaOrigenId,
    cuentaDestinoId: datos.cuentaDestinoId,
    movimientoRelacionadoId: null,
    tipo: 'transferencia',
    monto: datos.monto,
    categoriaId: null,
    descripcion: datos.descripcion ?? null,
    notas: datos.notas ?? null,
    fechaMovimiento: datos.fechaMovimiento,
    comprobanteUrl: null,
    recurrente: false,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
}

export interface CambiosMovimiento {
  monto?: number;
  categoriaId?: string | null;
  descripcion?: string | null;
  notas?: string | null;
  fechaMovimiento?: string;
  comprobanteUrl?: string | null;
}

export async function actualizarMovimiento(db: SQLiteDatabase, id: string, cambios: CambiosMovimiento): Promise<void> {
  const columnas: string[] = [];
  const parametros: (string | number | null)[] = [];

  if (cambios.monto !== undefined) {
    columnas.push('monto = ?');
    parametros.push(cambios.monto);
  }
  if (cambios.categoriaId !== undefined) {
    columnas.push('categoria_id = ?');
    parametros.push(cambios.categoriaId);
  }
  if (cambios.descripcion !== undefined) {
    columnas.push('descripcion = ?');
    parametros.push(cambios.descripcion);
  }
  if (cambios.notas !== undefined) {
    columnas.push('notas = ?');
    parametros.push(cambios.notas);
  }
  if (cambios.fechaMovimiento !== undefined) {
    columnas.push('fecha_movimiento = ?');
    parametros.push(cambios.fechaMovimiento);
  }
  if (cambios.comprobanteUrl !== undefined) {
    columnas.push('comprobante_url = ?');
    parametros.push(cambios.comprobanteUrl);
  }
  if (columnas.length === 0) return;

  const ahora = new Date().toISOString();
  columnas.push('actualizado_en = ?');
  parametros.push(ahora, id);

  await db.runAsync(`UPDATE movimientos SET ${columnas.join(', ')} WHERE id = ?`, parametros);

  const payload: Record<string, unknown> = { actualizado_en: ahora };
  if (cambios.monto !== undefined) payload.monto = cambios.monto;
  if (cambios.categoriaId !== undefined) payload.categoria_id = cambios.categoriaId;
  if (cambios.descripcion !== undefined) payload.descripcion = cambios.descripcion;
  if (cambios.notas !== undefined) payload.notas = cambios.notas;
  if (cambios.fechaMovimiento !== undefined) payload.fecha_movimiento = cambios.fechaMovimiento;
  if (cambios.comprobanteUrl !== undefined) payload.comprobante_url = cambios.comprobanteUrl;
  await encolarCambio(db, 'movimientos', id, 'actualizar', payload);
}

export async function eliminarMovimiento(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM movimientos WHERE id = ?', [id]);
  await encolarCambio(db, 'movimientos', id, 'eliminar', null);
}
