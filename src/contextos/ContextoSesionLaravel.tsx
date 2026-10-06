import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { cerrarSesionLaravel, iniciarSesionLaravel } from '@/src/servicios/laravelApi/autenticacion';
import { alExpirarSesionLaravel, obtenerTokenLaravel } from '@/src/servicios/laravelApi/sesion';
import { obtenerLaravel } from '@/src/servicios/laravelApi/cliente';
import type { UsuarioAPI } from '@/src/tipos/laravelApi';

interface ContextoSesionLaravelValor {
  autenticado: boolean;
  verificando: boolean;
  usuario: UsuarioAPI | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const ContextoSesionLaravel = createContext<ContextoSesionLaravelValor | undefined>(undefined);

export function ProveedorSesionLaravel({ children }: { children: ReactNode }) {
  const [verificando, setVerificando] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioAPI | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const token = await obtenerTokenLaravel();
      if (!token) {
        if (activo) setVerificando(false);
        return;
      }
      try {
        const usuarioActual = await obtenerLaravel<UsuarioAPI>('/user');
        if (activo) setUsuario(usuarioActual);
      } catch {
        // Token inválido o expirado: el cliente ya lo elimina en un 401.
      } finally {
        if (activo) setVerificando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => alExpirarSesionLaravel(() => setUsuario(null)), []);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const usuarioActual = await iniciarSesionLaravel(email, password);
    setUsuario(usuarioActual);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await cerrarSesionLaravel();
    } catch {
      // El token local ya se borra en el finally de cerrarSesionLaravel; un
      // fallo al avisarle al backend (p. ej. sin red) no debe dejar a la UI
      // mostrando la sección como si la sesión siguiera activa.
    } finally {
      setUsuario(null);
    }
  }, []);

  const valor = useMemo<ContextoSesionLaravelValor>(
    () => ({ autenticado: usuario !== null, verificando, usuario, iniciarSesion, cerrarSesion }),
    [usuario, verificando, iniciarSesion, cerrarSesion]
  );

  return <ContextoSesionLaravel.Provider value={valor}>{children}</ContextoSesionLaravel.Provider>;
}

export function useSesionLaravel(): ContextoSesionLaravelValor {
  const contexto = useContext(ContextoSesionLaravel);
  if (!contexto) throw new Error('useSesionLaravel debe usarse dentro de ProveedorSesionLaravel');
  return contexto;
}
