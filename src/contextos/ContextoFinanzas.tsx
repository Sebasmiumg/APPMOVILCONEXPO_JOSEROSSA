import { useSQLiteContext } from 'expo-sqlite';
import { AppState } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  crearCategoriaPersonalizada as crearCategoriaPersonalizadaRepositorio,
  listarCategorias,
} from '@/src/base-datos/repositorios/categoriasRepositorio';
import {
  archivarCuenta as archivarCuentaRepositorio,
  crearCuenta as crearCuentaRepositorio,
  type DatosNuevaCuenta,
  listarCuentas,
} from '@/src/base-datos/repositorios/cuentasRepositorio';
import {
  actualizarMovimiento as actualizarMovimientoRepositorio,
  type CambiosMovimiento,
  crearMovimiento as crearMovimientoRepositorio,
  crearTransferencia as crearTransferenciaRepositorio,
  type DatosNuevaTransferencia,
  type DatosNuevoMovimiento,
  eliminarMovimiento as eliminarMovimientoRepositorio,
  listarMovimientos,
} from '@/src/base-datos/repositorios/movimientosRepositorio';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useSesion } from '@/src/contextos/ContextoSesion';
import { notificarMovimientoRecurrente } from '@/src/servicios/notificaciones/alertasPresupuesto';
import { procesarMovimientosRecurrentes } from '@/src/servicios/recurrencia/procesarRecurrentes';
import { descargarDatosUsuarioSiHaceFalta } from '@/src/servicios/sincronizacion/descarga';
import { dispararSincronizacionEnSegundoPlano } from '@/src/servicios/sincronizacion/sincronizador';
import { supabase } from '@/src/servicios/supabase/cliente';
import type { Categoria, TipoCategoria } from '@/src/tipos/categoria';
import type { Cuenta } from '@/src/tipos/cuenta';
import type { Movimiento } from '@/src/tipos/movimiento';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

interface ValorContextoFinanzas {
  cuentas: Cuenta[];
  categorias: Categoria[];
  movimientos: Movimiento[];
  cargando: boolean;
  recargar: () => Promise<void>;
  crearCuenta: (datos: DatosNuevaCuenta) => Promise<Cuenta>;
  archivarCuenta: (id: string) => Promise<void>;
  categoriasPorTipo: (tipo: TipoCategoria) => Categoria[];
  crearCategoriaPersonalizada: (tipo: TipoCategoria, nombre: string) => Promise<Categoria>;
  crearMovimiento: (datos: DatosNuevoMovimiento) => Promise<Movimiento>;
  crearTransferencia: (datos: DatosNuevaTransferencia) => Promise<Movimiento>;
  actualizarMovimiento: (id: string, cambios: CambiosMovimiento) => Promise<void>;
  eliminarMovimiento: (id: string) => Promise<void>;
}

const ContextoFinanzas = createContext<ValorContextoFinanzas | undefined>(undefined);

export function ProveedorFinanzas({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const { usuario, configurado, cargando: sesionCargando } = useSesion();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const yaProcesoRecurrentes = useRef(false);
  const usuarioIdActual = useRef(usuario?.id);

  useLayoutEffect(() => {
    usuarioIdActual.current = usuario?.id;
  }, [usuario?.id]);

  const recargar = useCallback(async () => {
    if (configurado && (sesionCargando || !usuario)) {
      setCuentas([]);
      setCategorias([]);
      setMovimientos([]);
      setCargando(sesionCargando);
      return;
    }
    if (configurado) {
      setCuentas([]);
      setCategorias([]);
      setMovimientos([]);
      setCargando(true);
    }
    const usuarioIdConsultado = usuario?.id;
    await descargarDatosUsuarioSiHaceFalta(db, usuarioIdConsultado);
    const [listaCuentas, listaCategorias, listaMovimientos] = await Promise.all([
      listarCuentas(db),
      listarCategorias(db),
      listarMovimientos(db),
    ]);
    // Una consulta anterior puede terminar después de cambiar o cerrar sesión.
    // Ignorar ese resultado evita volver a mostrar datos del usuario anterior.
    if (usuarioIdActual.current !== usuarioIdConsultado) return;
    setCuentas(listaCuentas);
    setCategorias(listaCategorias);
    setMovimientos(listaMovimientos);
    setCargando(false);
    dispararSincronizacionEnSegundoPlano(db, usuario?.id);
  }, [db, usuario?.id, configurado, sesionCargando]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void recargar();
    });
    return () => suscripcion.remove();
  }, [recargar]);

  useEffect(() => {
    const clienteSupabase = supabase;
    if (!clienteSupabase || !usuario?.id) return;
    const canal = clienteSupabase.channel(`finanzas-${usuario.id}`);
    for (const tabla of ['cuentas', 'categorias', 'movimientos'] as const) {
      canal.on('postgres_changes', {
        event: '*', schema: 'public', table: tabla, filter: `usuario_id=eq.${usuario.id}`,
      }, () => { void recargar(); });
    }
    canal.subscribe();
    return () => { void clienteSupabase.removeChannel(canal); };
  }, [recargar, usuario?.id]);

  // Se ejecuta una sola vez por sesión de la app (justo como el "puente" de
  // configuración inicial en cliente.ts): pone al día los movimientos marcados como
  // recurrentes creando la siguiente ocurrencia de cada serie si ya venció su mes.
  useEffect(() => {
    if (yaProcesoRecurrentes.current || (configurado && (sesionCargando || !usuario))) return;
    yaProcesoRecurrentes.current = true;
    (async () => {
      const creados = await procesarMovimientosRecurrentes(db);
      if (creados.length === 0) return;
      await recargar();
      const listaCuentas = await listarCuentas(db);
      for (const movimiento of creados) {
        const cuenta = listaCuentas.find((c) => c.id === movimiento.cuentaId);
        await notificarMovimientoRecurrente(
          movimiento.descripcion || t(`pantallas.movimientoNuevo.${movimiento.tipo}`),
          formatearMoneda(movimiento.monto, cuenta?.moneda ?? 'GTQ', idioma),
          t
        );
      }
    })();
  }, [db, recargar, t, idioma, configurado, sesionCargando, usuario]);

  const valor = useMemo<ValorContextoFinanzas>(
    () => ({
      cuentas,
      categorias,
      movimientos,
      cargando,
      recargar,
      crearCuenta: async (datos) => {
        const cuenta = await crearCuentaRepositorio(db, datos);
        await recargar();
        return cuenta;
      },
      archivarCuenta: async (id) => {
        await archivarCuentaRepositorio(db, id);
        await recargar();
      },
      categoriasPorTipo: (tipo) => categorias.filter((categoria) => categoria.tipo === tipo),
      crearCategoriaPersonalizada: async (tipo, nombre) => {
        const categoria = await crearCategoriaPersonalizadaRepositorio(db, { tipo, nombre });
        await recargar();
        return categoria;
      },
      crearMovimiento: async (datos) => {
        const movimiento = await crearMovimientoRepositorio(db, datos);
        await recargar();
        return movimiento;
      },
      crearTransferencia: async (datos) => {
        const movimiento = await crearTransferenciaRepositorio(db, datos);
        await recargar();
        return movimiento;
      },
      actualizarMovimiento: async (id, cambios) => {
        await actualizarMovimientoRepositorio(db, id, cambios);
        await recargar();
      },
      eliminarMovimiento: async (id) => {
        await eliminarMovimientoRepositorio(db, id);
        await recargar();
      },
    }),
    [cuentas, categorias, movimientos, cargando, recargar, db]
  );

  return <ContextoFinanzas.Provider value={valor}>{children}</ContextoFinanzas.Provider>;
}

export function useFinanzas(): ValorContextoFinanzas {
  const contexto = useContext(ContextoFinanzas);
  if (!contexto) {
    throw new Error('useFinanzas debe usarse dentro de ProveedorFinanzas');
  }
  return contexto;
}
