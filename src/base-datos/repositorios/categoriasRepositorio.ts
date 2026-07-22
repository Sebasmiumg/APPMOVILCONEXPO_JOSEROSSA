import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { colorCategoria } from '@/src/base-datos/categoriasSemilla';
import { encolarCambio } from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';
import { type Categoria, type FilaCategoriaSQL, mapearFilaCategoria, type TipoCategoria } from '@/src/tipos/categoria';

export async function listarCategorias(db: SQLiteDatabase, tipo?: TipoCategoria): Promise<Categoria[]> {
  const filas = tipo
    ? await db.getAllAsync<FilaCategoriaSQL>(
        'SELECT * FROM categorias WHERE activa = 1 AND tipo = ? ORDER BY nombre_clave_traduccion IS NULL, nombre_clave_traduccion, nombre_personalizado',
        [tipo]
      )
    : await db.getAllAsync<FilaCategoriaSQL>(
        'SELECT * FROM categorias WHERE activa = 1 ORDER BY nombre_clave_traduccion IS NULL, nombre_clave_traduccion, nombre_personalizado'
      );
  return filas.map(mapearFilaCategoria);
}

export async function crearCategoriaPersonalizada(
  db: SQLiteDatabase,
  datos: { tipo: TipoCategoria; nombre: string; icono?: string }
): Promise<Categoria> {
  const id = Crypto.randomUUID();
  const icono = datos.icono ?? 'label';
  const color = colorCategoria(Math.floor(Math.random() * 8));
  const ahora = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO categorias (id, tipo, nombre_clave_traduccion, nombre_personalizado, icono, color, activa, actualizado_en)
     VALUES (?, ?, NULL, ?, ?, ?, 1, ?)`,
    [id, datos.tipo, datos.nombre, icono, color, ahora]
  );

  // Solo las categorías personalizadas (con dueño) se sincronizan; las globales
  // sembradas localmente no tienen usuario_id y no deben empujarse a Supabase.
  await encolarCambio(db, 'categorias', id, 'insertar', {
    tipo: datos.tipo,
    nombre_clave_traduccion: null,
    nombre_personalizado: datos.nombre,
    icono,
    color,
    activa: true,
    actualizado_en: ahora,
  });

  return {
    id,
    tipo: datos.tipo,
    claveTraduccion: null,
    nombrePersonalizado: datos.nombre,
    icono,
    color,
    activa: true,
  };
}

export async function archivarCategoria(db: SQLiteDatabase, id: string): Promise<void> {
  const ahora = new Date().toISOString();
  await db.runAsync('UPDATE categorias SET activa = 0, actualizado_en = ? WHERE id = ?', [ahora, id]);
  await encolarCambio(db, 'categorias', id, 'actualizar', { activa: false, actualizado_en: ahora });
}
