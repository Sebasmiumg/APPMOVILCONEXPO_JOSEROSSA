import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { adaptadorAlmacenamientoSesion } from '@/src/servicios/supabase/almacenamientoSesion';

const URL_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_URL;
const CLAVE_PUBLICA_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function supabaseEstaConfigurado(): boolean {
  return Boolean(URL_SUPABASE && CLAVE_PUBLICA_SUPABASE);
}

// `typeof window` (no Platform.OS) distingue un entorno real (navegador o
// runtime nativo, donde React Native define `global.window`) del renderizado
// estático en Node durante `expo export --platform web`, donde no existe
// `window` y el storage web de AsyncStorage revienta al inicializar
// GoTrueClient si el cliente se crea de forma incondicional en el módulo.
const hayEntornoDeEjecucion = typeof window !== 'undefined';

// `supabase` es `null` mientras no existan las variables de entorno EXPO_PUBLIC_SUPABASE_*
// (ver .env.example). El resto de la app debe comprobar supabaseEstaConfigurado()
// antes de usarlo y, si no está configurado, seguir funcionando en modo local.
export const supabase: SupabaseClient | null = supabaseEstaConfigurado() && hayEntornoDeEjecucion
  ? createClient(URL_SUPABASE as string, CLAVE_PUBLICA_SUPABASE as string, {
      auth: {
        storage: adaptadorAlmacenamientoSesion,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
