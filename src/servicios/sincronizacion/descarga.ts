import type { SQLiteDatabase } from 'expo-sqlite';

import { CLAVES_ALMACENAMIENTO, claveDescargaInicial } from '@/src/constantes/almacenamiento';
import { eliminarPreferencia, guardarPreferencia, obtenerPreferencia } from '@/src/almacenamiento/preferenciasDispositivo';
import { supabase, supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import { sincronizarCambiosPendientes } from '@/src/servicios/sincronizacion/sincronizador';
import { listarPendientes } from '@/src/base-datos/repositorios/colaSincronizacionRepositorio';

// Sincronización de BAJADA: sin esto, iniciar sesión en un dispositivo o
// navegador nuevo mostraba una base local vacía aunque el usuario ya tuviera
// datos guardados en Supabase (el sincronizador.ts existente solo empuja
// cambios locales hacia arriba, nunca trae nada hacia abajo). Se corre una
// se ejecuta al recargar para mantener actualizados los datos que también
// pueden cambiar desde la API o desde otro dispositivo.
//
// La base local no tiene columna usuario_id en ninguna tabla, así que antes
// de traer los datos del usuario activo hay que asegurarse de que no quedó
// nada del usuario anterior: ver limpiarSiCambioDeUsuario más abajo.

// La base SQLite es única por dispositivo, así que las descargas de usuarios
// distintos deben ejecutarse en orden. Compartir una sola promesa sin mirar el
// usuario permitía que una sesión nueva leyera el snapshot de la sesión previa.
const descargasEnCurso = new Map<string, Promise<void>>();
let colaDescargas: Promise<void> = Promise.resolve();

export function descargarDatosUsuarioSiHaceFalta(db: SQLiteDatabase, usuarioId: string | undefined): Promise<void> {
  if (!usuarioId) return Promise.resolve();
  const existente = descargasEnCurso.get(usuarioId);
  // Reutilizar solo si esta descarga sigue al final de la cola. Si se solicitó
  // otra cuenta después, hay que programar otra vez a este usuario al final;
  // en caso contrario podría recibir datos del usuario intermedio.
  if (existente && existente === colaDescargas) return existente;

  const ejecucion = colaDescargas
    .catch(() => {})
    .then(() => sincronizarUsuarioActivo(db, usuarioId))
    .finally(() => {
      if (descargasEnCurso.get(usuarioId) === ejecucion) descargasEnCurso.delete(usuarioId);
  });
  descargasEnCurso.set(usuarioId, ejecucion);
  colaDescargas = ejecucion;
  return ejecucion;
}

async function sincronizarUsuarioActivo(db: SQLiteDatabase, usuarioId: string): Promise<void> {
  await limpiarSiCambioDeUsuario(db, usuarioId);
  await ejecutarDescarga(db, usuarioId);
}

// Si la base local tiene datos de OTRO usuario (se inició sesión con una
// cuenta distinta en este mismo dispositivo), los borra antes de que el
// usuario activo vea nada. No toca las categorías "semilla" (las que vienen
// con la app, sin nombre_clave_traduccion NULL) porque esas son globales,
// no de un usuario — ver sembrarCategoriasGlobales en base-datos/cliente.ts.
//
// Importante: solo borra cuando YA había un dueño distinto registrado. La
// primera vez que esto corre en un dispositivo (dueñoActual nunca escrito)
// NO se borra nada — ese dispositivo pudo venir usándose normalmente desde
// antes de que existiera este mecanismo, con cambios locales (incluyendo
// eliminaciones) que todavía no terminaron de subirse a Supabase. Borrar en
// ese momento destruiría esos cambios sin haberlos sincronizado nunca.
async function limpiarSiCambioDeUsuario(db: SQLiteDatabase, usuarioId: string): Promise<void> {
  const dueñoActual = await obtenerPreferencia(CLAVES_ALMACENAMIENTO.usuarioDatosLocales);
  if (dueñoActual === usuarioId) return;
  if (!dueñoActual) {
    await guardarPreferencia(CLAVES_ALMACENAMIENTO.usuarioDatosLocales, usuarioId);
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM cola_sincronizacion');
    await db.runAsync('DELETE FROM aportes_meta');
    await db.runAsync('DELETE FROM metas');
    await db.runAsync('DELETE FROM presupuestos');
    await db.runAsync('DELETE FROM movimientos');
    await db.runAsync('DELETE FROM cuentas');
    await db.runAsync('DELETE FROM categorias WHERE nombre_clave_traduccion IS NULL');
  });
  // Si este usuario ya se había descargado antes en este mismo dispositivo
  // (ej. vuelve después de que otra cuenta lo usó y lo limpió), hay que
  // forzar una descarga nueva: la base local que dejó el borrado de arriba
  // está vacía, sin importar lo que diga esa bandera vieja.
  await eliminarPreferencia(claveDescargaInicial(usuarioId));

  await guardarPreferencia(CLAVES_ALMACENAMIENTO.usuarioDatosLocales, usuarioId);
}

async function ejecutarDescarga(db: SQLiteDatabase, usuarioId: string): Promise<void> {
  if (!supabaseEstaConfigurado() || !supabase) return;

  const clave = claveDescargaInicial(usuarioId);
  try {
    // Primero subimos lo local para no reemplazar un cambio aún pendiente con
    // una versión remota más antigua.
    await sincronizarCambiosPendientes(db, usuarioId);
    const clavesPendientes = new Set((await listarPendientes(db)).map((fila) => `${fila.tabla}:${fila.registroId}`));
    const [cuentas, categorias, movimientos, presupuestos, metas] = await Promise.all([
      supabase.from('cuentas').select('*').eq('usuario_id', usuarioId),
      supabase.from('categorias').select('*').or(`usuario_id.is.null,usuario_id.eq.${usuarioId}`),
      supabase.from('movimientos').select('*').eq('usuario_id', usuarioId),
      supabase.from('presupuestos').select('*').eq('usuario_id', usuarioId),
      supabase.from('metas').select('*').eq('usuario_id', usuarioId),
    ]);
    for (const resultado of [cuentas, categorias, movimientos, presupuestos, metas]) {
      if (resultado.error) throw new Error(resultado.error.message);
    }

    const idsMetas = (metas.data ?? []).map((m) => m.id as string);
    const aportes = idsMetas.length > 0 ? await supabase.from('aportes_meta').select('*').in('meta_id', idsMetas) : null;
    if (aportes?.error) throw new Error(aportes.error.message);

    await db.withTransactionAsync(async () => {
      for (const c of cuentas.data ?? []) {
        if (clavesPendientes.has(`cuentas:${c.id}`)) continue;
        await db.runAsync(
          `INSERT INTO cuentas (id, nombre, tipo, moneda, saldo_inicial, color, icono, activa, creada_en, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET nombre=excluded.nombre, tipo=excluded.tipo, moneda=excluded.moneda,
           saldo_inicial=excluded.saldo_inicial, color=excluded.color, icono=excluded.icono,
           activa=excluded.activa, actualizado_en=excluded.actualizado_en`,
          [c.id, c.nombre, c.tipo, c.moneda, Number(c.saldo_inicial), c.color, c.icono, c.activa ? 1 : 0, c.creada_en, c.actualizado_en]
        );
      }
      for (const cat of categorias.data ?? []) {
        if (clavesPendientes.has(`categorias:${cat.id}`)) continue;
        await db.runAsync(
          `INSERT INTO categorias (id, tipo, nombre_clave_traduccion, nombre_personalizado, icono, color, activa, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET tipo=excluded.tipo, nombre_clave_traduccion=excluded.nombre_clave_traduccion,
           nombre_personalizado=excluded.nombre_personalizado, icono=excluded.icono, color=excluded.color,
           activa=excluded.activa, actualizado_en=excluded.actualizado_en`,
          [cat.id, cat.tipo, cat.nombre_clave_traduccion, cat.nombre_personalizado, cat.icono, cat.color, cat.activa ? 1 : 0, cat.actualizado_en]
        );
      }
      for (const m of movimientos.data ?? []) {
        if (clavesPendientes.has(`movimientos:${m.id}`)) continue;
        await db.runAsync(
          `INSERT INTO movimientos (id, cuenta_id, cuenta_destino_id, movimiento_relacionado_id, tipo, monto, categoria_id, descripcion, notas, fecha_movimiento, comprobante_url, recurrente, creado_en, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET cuenta_id=excluded.cuenta_id, cuenta_destino_id=excluded.cuenta_destino_id,
           movimiento_relacionado_id=excluded.movimiento_relacionado_id, tipo=excluded.tipo, monto=excluded.monto,
           categoria_id=excluded.categoria_id, descripcion=excluded.descripcion, notas=excluded.notas,
           fecha_movimiento=excluded.fecha_movimiento, comprobante_url=excluded.comprobante_url,
           recurrente=excluded.recurrente, actualizado_en=excluded.actualizado_en`,
          [
            m.id, m.cuenta_id, m.cuenta_destino_id, m.movimiento_relacionado_id, m.tipo, Number(m.monto),
            m.categoria_id, m.descripcion, m.notas, m.fecha_movimiento, m.comprobante_url, m.recurrente ? 1 : 0,
            m.creado_en, m.actualizado_en,
          ]
        );
      }
      for (const p of presupuestos.data ?? []) {
        if (clavesPendientes.has(`presupuestos:${p.id}`)) continue;
        await db.runAsync(
          `INSERT INTO presupuestos (id, categoria_id, periodo, limite, porcentaje_alerta, creado_en, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET categoria_id=excluded.categoria_id, periodo=excluded.periodo,
           limite=excluded.limite, porcentaje_alerta=excluded.porcentaje_alerta`,
          [p.id, p.categoria_id, p.periodo, Number(p.limite), p.porcentaje_alerta, p.creado_en, p.creado_en]
        );
      }
      for (const meta of metas.data ?? []) {
        if (clavesPendientes.has(`metas:${meta.id}`)) continue;
        await db.runAsync(
          `INSERT INTO metas (id, cuenta_id, nombre, monto_objetivo, monto_actual, fecha_objetivo, estado, creada_en, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET cuenta_id=excluded.cuenta_id, nombre=excluded.nombre,
           monto_objetivo=excluded.monto_objetivo, monto_actual=excluded.monto_actual,
           fecha_objetivo=excluded.fecha_objetivo, estado=excluded.estado, actualizado_en=excluded.actualizado_en`,
          [
            meta.id, meta.cuenta_id, meta.nombre, Number(meta.monto_objetivo), Number(meta.monto_actual),
            meta.fecha_objetivo, meta.estado, meta.creada_en, meta.creada_en,
          ]
        );
      }
      for (const a of aportes?.data ?? []) {
        if (clavesPendientes.has(`aportes_meta:${a.id}`)) continue;
        await db.runAsync(
          `INSERT INTO aportes_meta (id, meta_id, monto, fecha, nota) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET meta_id=excluded.meta_id, monto=excluded.monto, fecha=excluded.fecha, nota=excluded.nota`,
          [a.id, a.meta_id, Number(a.monto), a.fecha, a.nota]
        );
      }
    });

    await guardarPreferencia(clave, 'true');
  } catch {
    // Sin conexión u otro fallo: no se marca como completa, así que se
    // reintenta en el próximo inicio de sesión en este dispositivo.
  }
}
