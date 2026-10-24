import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { adaptadorAlmacenamientoSesion } from '@/src/servicios/supabase/almacenamientoSesion';

const URL_SUPABASE = process.env.EXPO_PUBLIC_FRAMEWORKS_SUPABASE_URL;
const CLAVE_PUBLICA_SUPABASE = process.env.EXPO_PUBLIC_FRAMEWORKS_SUPABASE_ANON_KEY;

export function frameworksSupabaseEstaConfigurado(): boolean {
  return Boolean(URL_SUPABASE && CLAVE_PUBLICA_SUPABASE);
}

// `typeof window` (no Platform.OS) es lo que distingue un entorno real
// (navegador o runtime nativo, donde React Native define `global.window`) del
// renderizado estático en Node durante `expo export --platform web`, donde no
// existe `window` y el storage web de AsyncStorage revienta al inicializar
// GoTrueClient si el cliente se crea de forma incondicional en el módulo.
const hayEntornoDeEjecucion = typeof window !== 'undefined';

// Proyecto de Supabase de un compañero de equipo, distinto al propio de la
// app (ver src/servicios/supabase/cliente.ts). Usa un storageKey propio para
// que su sesión no choque con la del proyecto propio en el mismo dispositivo.
export const supabaseFrameworks: SupabaseClient | null = frameworksSupabaseEstaConfigurado() && hayEntornoDeEjecucion
  ? createClient(URL_SUPABASE as string, CLAVE_PUBLICA_SUPABASE as string, {
      auth: {
        storage: adaptadorAlmacenamientoSesion,
        storageKey: 'sb-frameworks-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
