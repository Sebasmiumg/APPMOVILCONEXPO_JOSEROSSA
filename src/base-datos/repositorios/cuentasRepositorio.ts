import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { encolarCambio } from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';
import { type Cuenta, type FilaCuentaSQL, mapearFilaCuenta } from '@/src/tipos/cuenta';
import type { CodigoMoneda, TipoCuenta } from '@/src/tipos/finanzas';

export interface DatosNuevaCuenta {
  nombre: string;
  tipo: TipoCuenta;
  moneda: CodigoMoneda;
  saldoInicial: number;
  color?: string | null;
  icono?: string | null;
}

export async function listarCuentas(db: SQLiteDatabase, incluirArchivadas = false): Promise<Cuenta[]> {
  const filas = await db.getAllAsync<FilaCuentaSQL>(
    incluirArchivadas
      ? 'SELECT * FROM cuentas ORDER BY creada_en ASC'
      : 'SELECT * FROM cuentas WHERE activa = 1 ORDER BY creada_en ASC'
  );
  return filas.map(mapearFilaCuenta);
}

export async function obtenerCuenta(db: SQLiteDatabase, id: string): Promise<Cuenta | null> {
  const fila = await db.getFirstAsync<FilaCuentaSQL>('SELECT * FROM cuentas WHERE id = ?', [id]);
  return fila ? mapearFilaCuenta(fila) : null;
}

export async function crearCuenta(db: SQLiteDatabase, datos: DatosNuevaCuenta): Promise<Cuenta> {
  const id = Crypto.randomUUID();
  const ahora = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO cuentas (id, nombre, tipo, moneda, saldo_inicial, color, icono, activa, creada_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, datos.nombre, datos.tipo, datos.moneda, datos.saldoInicial, datos.color ?? null, datos.icono ?? null, ahora, ahora]
  );

  await encolarCambio(db, 'cuentas', id, 'insertar', {
    nombre: datos.nombre,
    tipo: datos.tipo,
    moneda: datos.moneda,
    saldo_inicial: datos.saldoInicial,
    color: datos.color ?? null,
    icono: datos.icono ?? null,
    activa: true,
    creada_en: ahora,
    actualizado_en: ahora,
  });

  return {
    id,
    nombre: datos.nombre,
    tipo: datos.tipo,
    moneda: datos.moneda,
    saldoInicial: datos.saldoInicial,
    color: datos.color ?? null,
    icono: datos.icono ?? null,
    activa: true,
    creadaEn: ahora,
    actualizadoEn: ahora,
  };
}

export async function archivarCuenta(db: SQLiteDatabase, id: string): Promise<void> {
  const ahora = new Date().toISOString();
  await db.runAsync('UPDATE cuentas SET activa = 0, actualizado_en = ? WHERE id = ?', [ahora, id]);
  await encolarCambio(db, 'cuentas', id, 'actualizar', { activa: false, actualizado_en: ahora });
}
