import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';

import { useSesion } from '@/src/contextos/ContextoSesion';
import { cerrarSesionSupabase } from '@/src/servicios/supabase/autenticacion';
import type { UsuarioAPI } from '@/src/tipos/laravelApi';
import { tieneAccesoCapacitaciones } from '@/src/utilidades/accesoCapacitaciones';

interface ContextoSesionLaravelValor {
  autenticado: boolean;
  accesoDenegado: boolean;
  verificando: boolean;
  usuario: UsuarioAPI | null;
  cerrarSesion: () => Promise<void>;
}

const ContextoSesionLaravel = createContext<ContextoSesionLaravelValor | undefined>(undefined);

export function ProveedorSesionLaravel({ children }: { children: ReactNode }) {
  const { usuario: usuarioSupabase, cargando: verificando } = useSesion();
  const metadata = usuarioSupabase?.user_metadata as Record<string, unknown> | undefined;
  const accesoDenegado = Boolean(usuarioSupabase && !tieneAccesoCapacitaciones(usuarioSupabase.email));
  const usuario = useMemo<UsuarioAPI | null>(() => {
    if (!usuarioSupabase?.email || !tieneAccesoCapacitaciones(usuarioSupabase.email)) return null;
    const nombre = metadata?.nombre ?? metadata?.name ?? metadata?.full_name;
    return {
      id: usuarioSupabase.id,
      name: typeof nombre === 'string' && nombre.trim() ? nombre : usuarioSupabase.email.split('@')[0],
      email: usuarioSupabase.email,
    };
  }, [usuarioSupabase, metadata]);

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionSupabase();
  }, []);

  const valor = useMemo<ContextoSesionLaravelValor>(
    () => ({ autenticado: usuario !== null, accesoDenegado, verificando, usuario, cerrarSesion }),
    [usuario, accesoDenegado, verificando, cerrarSesion]
  );

  return <ContextoSesionLaravel.Provider value={valor}>{children}</ContextoSesionLaravel.Provider>;
}

export function useSesionLaravel(): ContextoSesionLaravelValor {
  const contexto = useContext(ContextoSesionLaravel);
  if (!contexto) throw new Error('useSesionLaravel debe usarse dentro de ProveedorSesionLaravel');
  return contexto;
}
