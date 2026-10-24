import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase, supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';

interface ValorContextoSesion {
  configurado: boolean;
  sesion: Session | null;
  usuario: User | null;
  cargando: boolean;
}

const ContextoSesion = createContext<ValorContextoSesion | undefined>(undefined);

export function ProveedorSesion({ children }: { children: React.ReactNode }) {
  const configurado = supabaseEstaConfigurado();
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(configurado);

  useEffect(() => {
    if (!supabase) return;

    let desmontado = false;
    let recibioEvento = false;

    supabase.auth.getSession().then(({ data }) => {
      if (desmontado || recibioEvento) return;
      setSesion(data.session);
      setCargando(false);
    }).catch(() => {
      if (desmontado || recibioEvento) return;
      setSesion(null);
      setCargando(false);
    });

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      recibioEvento = true;
      setSesion(nuevaSesion);
      setCargando(false);
    });

    return () => {
      desmontado = true;
      suscripcion.subscription.unsubscribe();
    };
  }, []);

  const valor = useMemo<ValorContextoSesion>(
    () => ({ configurado, sesion, usuario: sesion?.user ?? null, cargando }),
    [configurado, sesion, cargando]
  );

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion(): ValorContextoSesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  }
  return contexto;
}
