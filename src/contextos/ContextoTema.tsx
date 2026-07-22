import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useEsquemaColorSistema } from 'react-native';

import { CLAVES_ALMACENAMIENTO } from '@/src/constantes/almacenamiento';
import { crearTema } from '@/src/temas/crearTema';
import type { ModoTema, Tema } from '@/src/tipos/tema';
import {
  guardarPreferencia,
  obtenerPreferencia,
} from '@/src/almacenamiento/preferenciasDispositivo';

interface ValorContextoTema {
  tema: Tema;
  modo: ModoTema;
  modoSeleccionadoPorUsuario: boolean;
  establecerModo: (modo: ModoTema) => void;
  listo: boolean;
}

const ContextoTema = createContext<ValorContextoTema | undefined>(undefined);

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const esquemaSistema = useEsquemaColorSistema();
  const [modo, setModo] = useState<ModoTema>('oscuro');
  const [modoSeleccionadoPorUsuario, setModoSeleccionadoPorUsuario] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    (async () => {
      const guardado = await obtenerPreferencia(CLAVES_ALMACENAMIENTO.tema);
      if (guardado === 'claro' || guardado === 'oscuro') {
        setModo(guardado);
        setModoSeleccionadoPorUsuario(true);
      } else {
        setModo(esquemaSistema === 'light' ? 'claro' : 'oscuro');
      }
      setListo(true);
    })();
    // Solo se ejecuta una vez al montar: la preferencia guardada tiene prioridad sobre el esquema del sistema.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const establecerModo = (nuevoModo: ModoTema) => {
    setModo(nuevoModo);
    setModoSeleccionadoPorUsuario(true);
    guardarPreferencia(CLAVES_ALMACENAMIENTO.tema, nuevoModo);
  };

  const valor = useMemo<ValorContextoTema>(
    () => ({
      tema: crearTema(modo),
      modo,
      modoSeleccionadoPorUsuario,
      establecerModo,
      listo,
    }),
    [modo, modoSeleccionadoPorUsuario, listo]
  );

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export function useTema(): ValorContextoTema {
  const contexto = useContext(ContextoTema);
  if (!contexto) {
    throw new Error('useTema debe usarse dentro de ProveedorTema');
  }
  return contexto;
}
