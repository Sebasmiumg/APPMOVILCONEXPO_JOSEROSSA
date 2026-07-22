import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { encolarCambio } from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';
import { type FilaPresupuestoSQL, mapearFilaPresupuesto, type Presupuesto } from '@/src/tipos/presupuesto';

export interface DatosNuevoPresupuesto {
  categoriaId: string;
  periodo: string;
  limite: number;
  porcentajeAlerta?: number;
}

export async function listarPresupuestos(db: SQLiteDatabase, periodo?: string): Promise<Presupuesto[]> {
  const filas = periodo
    ? await db.getAllAsync<FilaPresupuestoSQL>('SELECT * FROM presupuestos WHERE periodo = ? ORDER BY creado_en ASC', [periodo])
    : await db.getAllAsync<FilaPresupuestoSQL>('SELECT * FROM presupuestos ORDER BY periodo DESC, creado_en ASC');
  return filas.map(mapearFilaPresupuesto);
}

export async function crearPresupuesto(db: SQLiteDatabase, datos: DatosNuevoPresupuesto): Promise<Presupuesto> {
  const id = Crypto.randomUUID();
  const ahora = new Date().toISOString();
  const porcentajeAlerta = datos.porcentajeAlerta ?? 80;
  await db.runAsync(
    `INSERT INTO presupuestos (id, categoria_id, periodo, limite, porcentaje_alerta, creado_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, datos.categoriaId, datos.periodo, datos.limite, porcentajeAlerta, ahora, ahora]
  );

  await encolarCambio(db, 'presupuestos', id, 'insertar', {
    categoria_id: datos.categoriaId,
    periodo: datos.periodo,
    limite: datos.limite,
    porcentaje_alerta: porcentajeAlerta,
    creado_en: ahora,
    actualizado_en: ahora,
  });

  return {
    id,
    categoriaId: datos.categoriaId,
    periodo: datos.periodo,
    limite: datos.limite,
    porcentajeAlerta,
    creadoEn: ahora,
  };
}

export async function eliminarPresupuesto(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM presupuestos WHERE id = ?', [id]);
  await encolarCambio(db, 'presupuestos', id, 'eliminar', null);
}
