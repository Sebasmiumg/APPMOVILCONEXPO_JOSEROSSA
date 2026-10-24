import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { obtenerConfiguracionFinancieraInicial } from '@/src/almacenamiento/configuracionFinancieraInicial';
import { CATEGORIAS_SEMILLA, colorCategoria } from '@/src/base-datos/categoriasSemilla';
import { SQL_MIGRACION_V1, SQL_MIGRACION_V2, SQL_MIGRACION_V3, VERSION_ESQUEMA_ACTUAL } from '@/src/base-datos/esquema';

export const NOMBRE_BASE_DATOS = 'mipresupuesto.db';

export async function migrarBaseDatos(db: SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = fila?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(SQL_MIGRACION_V1);
    version = 1;
  }
  if (version < 2) {
    await db.execAsync(SQL_MIGRACION_V2);
    version = 2;
  }
  if (version < 3) {
    await db.execAsync(SQL_MIGRACION_V3);
    version = 3;
  }
  if (version < 4) {
    await migrarIdsCategoriasGlobales(db);
    version = 4;
  }

  await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA_ACTUAL}`);
  await sembrarCategoriasGlobales(db);
  await migrarConfiguracionInicialACuenta(db);
}

async function sembrarCategoriasGlobales(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let indice = 0; indice < CATEGORIAS_SEMILLA.length; indice += 1) {
      const semilla = CATEGORIAS_SEMILLA[indice];
      await db.runAsync(
        `INSERT OR IGNORE INTO categorias (id, tipo, nombre_clave_traduccion, nombre_personalizado, icono, color, activa)
         VALUES (?, ?, ?, NULL, ?, ?, 1)`,
        [semilla.id, semilla.tipo, semilla.clave, semilla.icono, colorCategoria(indice)]
      );
    }
  });
}

async function migrarIdsCategoriasGlobales(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    const idsAntiguos = new Map<string, string>();
    for (const semilla of CATEGORIAS_SEMILLA) {
      const idAntiguo = `cat-${semilla.tipo}-${semilla.clave}`;
      if (idAntiguo === semilla.id) continue;
      const antigua = await db.getFirstAsync<{
        tipo: string;
        nombre_clave_traduccion: string | null;
        nombre_personalizado: string | null;
        icono: string;
        color: string;
        activa: number;
        actualizado_en: string | null;
      }>('SELECT tipo, nombre_clave_traduccion, nombre_personalizado, icono, color, activa, actualizado_en FROM categorias WHERE id = ?', [idAntiguo]);
      if (!antigua) continue;

      await db.runAsync(
        `INSERT OR IGNORE INTO categorias (id, tipo, nombre_clave_traduccion, nombre_personalizado, icono, color, activa, actualizado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [semilla.id, antigua.tipo, antigua.nombre_clave_traduccion ?? semilla.clave, antigua.nombre_personalizado,
          antigua.icono || semilla.icono, antigua.color, antigua.activa, antigua.actualizado_en]
      );
      await db.runAsync('UPDATE movimientos SET categoria_id = ? WHERE categoria_id = ?', [semilla.id, idAntiguo]);
      await db.runAsync('UPDATE presupuestos SET categoria_id = ? WHERE categoria_id = ?', [semilla.id, idAntiguo]);
      idsAntiguos.set(idAntiguo, semilla.id);
      await db.runAsync('DELETE FROM categorias WHERE id = ?', [idAntiguo]);
    }

    if (idsAntiguos.size > 0) {
      const pendientes = await db.getAllAsync<{ id: string; payload: string | null }>(
        "SELECT id, payload FROM cola_sincronizacion WHERE tabla IN ('movimientos', 'presupuestos') AND payload IS NOT NULL"
      );
      for (const pendiente of pendientes) {
        try {
          const payload = JSON.parse(pendiente.payload ?? '{}') as Record<string, unknown>;
          const categoriaId = payload.categoria_id;
          if (typeof categoriaId === 'string' && idsAntiguos.has(categoriaId)) {
            payload.categoria_id = idsAntiguos.get(categoriaId);
            await db.runAsync('UPDATE cola_sincronizacion SET payload = ? WHERE id = ?', [JSON.stringify(payload), pendiente.id]);
          }
        } catch {
          // Se conserva la entrada intacta si un payload antiguo no se puede leer.
        }
      }
    }
  });
}

// Puente entre la configuración de la Fase 1 (guardada en AsyncStorage durante el
// onboarding) y la primera cuenta real en SQLite. Solo corre si aún no hay cuentas.
async function migrarConfiguracionInicialACuenta(db: SQLiteDatabase): Promise<void> {
  const { total } = (await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM cuentas'
  )) ?? { total: 0 };
  if (total > 0) return;

  const configuracion = await obtenerConfiguracionFinancieraInicial();
  if (!configuracion) return;

  const ahora = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO cuentas (id, nombre, tipo, moneda, saldo_inicial, color, icono, activa, creada_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      Crypto.randomUUID(),
      configuracion.nombreCuenta,
      configuracion.tipoCuenta,
      configuracion.moneda,
      configuracion.saldoInicial,
      '#7C4DFF',
      null,
      ahora,
      ahora,
    ]
  );
}
