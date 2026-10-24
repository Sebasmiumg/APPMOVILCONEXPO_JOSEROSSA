import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  actualizarProgresoMeta as actualizarProgresoMetaRepositorio,
  agregarAporteMeta as agregarAporteMetaRepositorio,
  archivarMeta as archivarMetaRepositorio,
  crearMeta as crearMetaRepositorio,
  type DatosNuevaMeta,
  listarAportesMeta,
  listarMetas,
} from '@/src/base-datos/repositorios/metasRepositorio';
import {
  crearPresupuesto as crearPresupuestoRepositorio,
  type DatosNuevoPresupuesto,
  eliminarPresupuesto as eliminarPresupuestoRepositorio,
  listarPresupuestos,
} from '@/src/base-datos/repositorios/presupuestosRepositorio';
import { useSesion } from '@/src/contextos/ContextoSesion';
import { descargarDatosUsuarioSiHaceFalta } from '@/src/servicios/sincronizacion/descarga';
import { dispararSincronizacionEnSegundoPlano } from '@/src/servicios/sincronizacion/sincronizador';
import { supabase } from '@/src/servicios/supabase/cliente';
import type { AporteMeta, Meta } from '@/src/tipos/meta';
import type { Presupuesto } from '@/src/tipos/presupuesto';

interface ValorContextoPlanificacion {
  presupuestos: Presupuesto[];
  metas: Meta[];
  cargando: boolean;
  recargar: () => Promise<void>;
  crearPresupuesto: (datos: DatosNuevoPresupuesto) => Promise<Presupuesto>;
  eliminarPresupuesto: (id: string) => Promise<void>;
  crearMeta: (datos: DatosNuevaMeta) => Promise<Meta>;
  agregarAporteMeta: (metaId: string, monto: number, nota?: string | null) => Promise<AporteMeta>;
  obtenerAportesMeta: (metaId: string) => Promise<AporteMeta[]>;
  actualizarProgresoMeta: (metaId: string, montoActual: number) => Promise<Meta>;
  archivarMeta: (id: string) => Promise<void>;
}

const ContextoPlanificacion = createContext<ValorContextoPlanificacion | undefined>(undefined);

export function ProveedorPlanificacion({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const { usuario, configurado, cargando: sesionCargando } = useSesion();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [cargando, setCargando] = useState(true);
  const usuarioIdActual = useRef(usuario?.id);

  useLayoutEffect(() => {
    usuarioIdActual.current = usuario?.id;
  }, [usuario?.id]);

  const recargar = useCallback(async () => {
    if (configurado && (sesionCargando || !usuario)) {
      setPresupuestos([]);
      setMetas([]);
      setCargando(sesionCargando);
      return;
    }
    if (configurado) {
      setPresupuestos([]);
      setMetas([]);
      setCargando(true);
    }
    const usuarioIdConsultado = usuario?.id;
    await descargarDatosUsuarioSiHaceFalta(db, usuarioIdConsultado);
    const [listaPresupuestos, listaMetas] = await Promise.all([listarPresupuestos(db), listarMetas(db)]);
    if (usuarioIdActual.current !== usuarioIdConsultado) return;
    setPresupuestos(listaPresupuestos);
    setMetas(listaMetas);
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
    const canal = clienteSupabase.channel(`planificacion-${usuario.id}`);
    for (const tabla of ['presupuestos', 'metas'] as const) {
      canal.on('postgres_changes', {
        event: '*', schema: 'public', table: tabla, filter: `usuario_id=eq.${usuario.id}`,
      }, () => { void recargar(); });
    }
    canal.subscribe();
    return () => { void clienteSupabase.removeChannel(canal); };
  }, [recargar, usuario?.id]);

  const valor = useMemo<ValorContextoPlanificacion>(
    () => ({
      presupuestos,
      metas,
      cargando,
      recargar,
      crearPresupuesto: async (datos) => {
        const presupuesto = await crearPresupuestoRepositorio(db, datos);
        await recargar();
        return presupuesto;
      },
      eliminarPresupuesto: async (id) => {
        await eliminarPresupuestoRepositorio(db, id);
        await recargar();
      },
      crearMeta: async (datos) => {
        const meta = await crearMetaRepositorio(db, datos);
        await recargar();
        return meta;
      },
      agregarAporteMeta: async (metaId, monto, nota) => {
        const aporte = await agregarAporteMetaRepositorio(db, metaId, monto, nota);
        await recargar();
        return aporte;
      },
      obtenerAportesMeta: (metaId) => listarAportesMeta(db, metaId),
      actualizarProgresoMeta: async (metaId, montoActual) => {
        const meta = await actualizarProgresoMetaRepositorio(db, metaId, montoActual);
        await recargar();
        return meta;
      },
      archivarMeta: async (id) => {
        await archivarMetaRepositorio(db, id);
        await recargar();
      },
    }),
    [presupuestos, metas, cargando, recargar, db]
  );

  return <ContextoPlanificacion.Provider value={valor}>{children}</ContextoPlanificacion.Provider>;
}

export function usePlanificacion(): ValorContextoPlanificacion {
  const contexto = useContext(ContextoPlanificacion);
  if (!contexto) {
    throw new Error('usePlanificacion debe usarse dentro de ProveedorPlanificacion');
  }
  return contexto;
}
