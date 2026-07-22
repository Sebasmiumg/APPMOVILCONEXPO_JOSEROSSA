import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from '@/src/idiomas/ar.json';
import en from '@/src/idiomas/en.json';
import es from '@/src/idiomas/es.json';
import hi from '@/src/idiomas/hi.json';
import zh from '@/src/idiomas/zh.json';

export const IDIOMAS_SOPORTADOS = ['es', 'en', 'zh', 'hi', 'ar'] as const;
export type CodigoIdioma = (typeof IDIOMAS_SOPORTADOS)[number];

export const IDIOMA_POR_DEFECTO: CodigoIdioma = 'es';

export const IDIOMAS_RTL: readonly CodigoIdioma[] = ['ar'];

// Nombres mostrados en la tarjeta de selección: siempre en el idioma nativo,
// independientemente del idioma activo actualmente en la interfaz.
export const NOMBRES_NATIVOS_IDIOMA: Record<CodigoIdioma, string> = {
  es: 'Español',
  en: 'English',
  zh: '简体中文',
  hi: 'हिन्दी',
  ar: 'العربية',
};

export function esIdiomaRTL(idioma: CodigoIdioma): boolean {
  return (IDIOMAS_RTL as readonly string[]).includes(idioma);
}

const recursos = {
  es: { translation: es },
  en: { translation: en },
  zh: { translation: zh },
  hi: { translation: hi },
  ar: { translation: ar },
};

export function detectarIdiomaDispositivo(): CodigoIdioma {
  const [preferido] = Localization.getLocales();
  const codigo = preferido?.languageCode?.toLowerCase();
  if (codigo && (IDIOMAS_SOPORTADOS as readonly string[]).includes(codigo)) {
    return codigo as CodigoIdioma;
  }
  return IDIOMA_POR_DEFECTO;
}

// Se inicializa de forma síncrona al importar el módulo: react-i18next necesita que
// initReactI18next esté registrado antes de que cualquier componente llame a useTranslation().
// El idioma real (guardado o detectado) se aplica después con i18n.changeLanguage().
void i18next.use(initReactI18next).init({
  resources: recursos,
  lng: IDIOMA_POR_DEFECTO,
  fallbackLng: IDIOMA_POR_DEFECTO,
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18next;
