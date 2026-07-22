import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { guardarPreferencia, obtenerPreferencia } from '@/src/almacenamiento/preferenciasDispositivo';
import { CLAVES_ALMACENAMIENTO } from '@/src/constantes/almacenamiento';
import {
  IDIOMA_POR_DEFECTO,
  IDIOMAS_SOPORTADOS,
  type CodigoIdioma,
  detectarIdiomaDispositivo,
  esIdiomaRTL,
} from '@/src/idiomas/configuracionIdioma';

interface ValorContextoIdioma {
  idioma: CodigoIdioma;
  establecerIdioma: (idioma: CodigoIdioma) => Promise<void>;
  esRTL: boolean;
  requiereReinicioRTL: boolean;
  listo: boolean;
}

const ContextoIdioma = createContext<ValorContextoIdioma | undefined>(undefined);

async function aplicarDireccionRTL(idioma: CodigoIdioma): Promise<boolean> {
  const debeSerRTL = esIdiomaRTL(idioma);
  if (I18nManager.isRTL === debeSerRTL) {
    return false;
  }
  I18nManager.allowRTL(debeSerRTL);
  I18nManager.forceRTL(debeSerRTL);
  if (Platform.OS === 'web') {
    return false;
  }
  return true;
}

export function ProveedorIdioma({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [idioma, setIdioma] = useState<CodigoIdioma>(IDIOMA_POR_DEFECTO);
  const [listo, setListo] = useState(false);
  const [requiereReinicioRTL, setRequiereReinicioRTL] = useState(false);

  useEffect(() => {
    (async () => {
      const guardado = await obtenerPreferencia(CLAVES_ALMACENAMIENTO.idioma);
      const inicial =
        guardado && (IDIOMAS_SOPORTADOS as readonly string[]).includes(guardado)
          ? (guardado as CodigoIdioma)
          : detectarIdiomaDispositivo();
      if (inicial !== IDIOMA_POR_DEFECTO) {
        await i18n.changeLanguage(inicial);
      }
      await aplicarDireccionRTL(inicial);
      setIdioma(inicial);
      setListo(true);
    })();
    // Se ejecuta una sola vez al montar: el idioma guardado tiene prioridad sobre el del dispositivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const establecerIdioma = async (nuevoIdioma: CodigoIdioma) => {
    await i18n.changeLanguage(nuevoIdioma);
    await guardarPreferencia(CLAVES_ALMACENAMIENTO.idioma, nuevoIdioma);
    const necesitaReinicio = await aplicarDireccionRTL(nuevoIdioma);
    setIdioma(nuevoIdioma);
    setRequiereReinicioRTL(necesitaReinicio);
  };

  const valor = useMemo<ValorContextoIdioma>(
    () => ({
      idioma,
      establecerIdioma,
      esRTL: esIdiomaRTL(idioma),
      requiereReinicioRTL,
      listo,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idioma, requiereReinicioRTL, listo]
  );

  return <ContextoIdioma.Provider value={valor}>{children}</ContextoIdioma.Provider>;
}

export function useIdioma(): ValorContextoIdioma {
  const contexto = useContext(ContextoIdioma);
  if (!contexto) {
    throw new Error('useIdioma debe usarse dentro de ProveedorIdioma');
  }
  return contexto;
}
