import type { SQLiteDatabase } from 'expo-sqlite';

import { crearMovimiento } from '@/src/base-datos/repositorios/movimientosRepositorio';
import { type FilaMovimientoSQL, mapearFilaMovimiento, type Movimiento } from '@/src/tipos/movimiento';

const MAXIMO_OCURRENCIAS_POR_SERIE = 24;

function sumarUnMes(fechaISO: string): Date {
  const fecha = new Date(fechaISO);
  fecha.setMonth(fecha.getMonth() + 1);
  return fecha;
}

// Un movimiento marcado como recurrente funciona como "cursor" de su serie: en cada
// arranque de la app, si ya pasó un mes desde su fecha, se crea la siguiente ocurrencia
// (con la misma cuenta/categoría/monto) y el cursor se traslada a esa nueva fila,
// dejando la anterior como un movimiento normal. Así no hace falta un id de serie
// aparte ni un scheduler en segundo plano: basta con revisar al iniciar la app.
export async function procesarMovimientosRecurrentes(db: SQLiteDatabase): Promise<Movimiento[]> {
  const filas = await db.getAllAsync<FilaMovimientoSQL>('SELECT * FROM movimientos WHERE recurrente = 1');
  const creados: Movimiento[] = [];
  const ahora = new Date();

  for (const fila of filas.map(mapearFilaMovimiento)) {
    if (fila.tipo === 'transferencia') continue;

    let cursor = fila;
    let iteraciones = 0;
    while (iteraciones < MAXIMO_OCURRENCIAS_POR_SERIE) {
      const siguienteFecha = sumarUnMes(cursor.fechaMovimiento);
      if (siguienteFecha > ahora) break;

      await db.runAsync('UPDATE movimientos SET recurrente = 0 WHERE id = ?', [cursor.id]);

      const nuevo = await crearMovimiento(db, {
        cuentaId: cursor.cuentaId,
        tipo: cursor.tipo as 'ingreso' | 'gasto' | 'ajuste',
        monto: cursor.monto,
        categoriaId: cursor.categoriaId,
        descripcion: cursor.descripcion,
        notas: cursor.notas,
        fechaMovimiento: siguienteFecha.toISOString(),
        comprobanteUrl: null,
        recurrente: true,
      });

      creados.push(nuevo);
      cursor = nuevo;
      iteraciones += 1;
    }
  }

  return creados;
}
