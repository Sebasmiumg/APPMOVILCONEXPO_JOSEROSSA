import { useSQLiteContext } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
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
import { dispararSincronizacionEnSegundoPlano } from '@/src/servicios/sincronizacion/sincronizador';
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
  archivarMeta: (id: string) => Promise<void>;
}

const ContextoPlanificacion = createContext<ValorContextoPlanificacion | undefined>(undefined);

export function ProveedorPlanificacion({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const { usuario } = useSesion();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    const [listaPresupuestos, listaMetas] = await Promise.all([listarPresupuestos(db), listarMetas(db)]);
    setPresupuestos(listaPresupuestos);
    setMetas(listaMetas);
    setCargando(false);
    dispararSincronizacionEnSegundoPlano(db, usuario?.id);
  }, [db, usuario?.id]);

  useEffect(() => {
    recargar();
  }, [recargar]);

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
