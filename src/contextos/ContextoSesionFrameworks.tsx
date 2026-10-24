import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabaseFrameworks } from '@/src/servicios/frameworksSupabase/cliente';

interface ContextoSesionFrameworksValor {
  autenticado: boolean;
  verificando: boolean;
  correo: string | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const ContextoSesionFrameworks = createContext<ContextoSesionFrameworksValor | undefined>(undefined);

export function ProveedorSesionFrameworks({ children }: { children: ReactNode }) {
  const [verificando, setVerificando] = useState(true);
  const [sesion, setSesion] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabaseFrameworks) {
      setVerificando(false);
      return;
    }

    let activo = true;
    supabaseFrameworks.auth.getSession().then(({ data }) => {
      if (activo) {
        setSesion(data.session);
        setVerificando(false);
      }
    });

    const { data: suscripcion } = supabaseFrameworks.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (activo) setSesion(nuevaSesion);
    });

    return () => {
      activo = false;
      suscripcion.subscription.unsubscribe();
    };
  }, []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    if (!supabaseFrameworks) throw new Error('sin_configurar');
    const { error } = await supabaseFrameworks.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const cerrarSesion = useCallback(async () => {
    if (!supabaseFrameworks) return;
    try {
      await supabaseFrameworks.auth.signOut();
    } catch {
      // Si signOut() falla (p. ej. sin red), lanza antes de limpiar la sesión
      // guardada, así que onAuthStateChange nunca dispara SIGNED_OUT y la UI
      // se queda mostrando la pantalla como si la sesión siguiera activa.
    } finally {
      setSesion(null);
    }
  }, []);

  const valor = useMemo<ContextoSesionFrameworksValor>(
    () => ({
      autenticado: sesion !== null,
      verificando,
      correo: sesion?.user.email ?? null,
      iniciarSesion,
      cerrarSesion,
    }),
    [sesion, verificando, iniciarSesion, cerrarSesion]
  );

  return <ContextoSesionFrameworks.Provider value={valor}>{children}</ContextoSesionFrameworks.Provider>;
}

export function useSesionFrameworks(): ContextoSesionFrameworksValor {
  const contexto = useContext(ContextoSesionFrameworks);
  if (!contexto) throw new Error('useSesionFrameworks debe usarse dentro de ProveedorSesionFrameworks');
  return contexto;
}
