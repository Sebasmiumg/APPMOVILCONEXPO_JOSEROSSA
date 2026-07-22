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

  await db.execAsync(`PRAGMA user_version = ${VERSION_ESQUEMA_ACTUAL}`);
  await sembrarCategoriasGlobales(db);
  await migrarConfiguracionInicialACuenta(db);
}

async function sembrarCategoriasGlobales(db: SQLiteDatabase): Promise<void> {
  const { total } = (await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM categorias'
  )) ?? { total: 0 };
  if (total > 0) return;

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
