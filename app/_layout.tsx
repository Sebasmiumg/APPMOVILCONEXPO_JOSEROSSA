import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  Fraunces_400Regular,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts as useFuentesDisplay,
} from '@expo-google-fonts/fraunces';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as ThemeProviderNavegacion } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { View } from 'react-native';
import 'react-native-reanimated';

import { NOMBRE_BASE_DATOS, migrarBaseDatos } from '@/src/base-datos/cliente';
import { PantallaBloqueo } from '@/src/componentes/seguridad/PantallaBloqueo';
import { ProveedorFinanzas } from '@/src/contextos/ContextoFinanzas';
import { ProveedorIdioma, useIdioma } from '@/src/contextos/ContextoIdioma';
import { ProveedorPlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { ProveedorSesion } from '@/src/contextos/ContextoSesion';
import { ProveedorTema, useTema } from '@/src/contextos/ContextoTema';
import '@/src/idiomas/configuracionIdioma';
import { autenticarConBiometria, bloqueoBiometricoActivado } from '@/src/servicios/seguridad/bloqueoBiometrico';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={NOMBRE_BASE_DATOS} onInit={migrarBaseDatos}>
      <ProveedorTema>
        <ProveedorIdioma>
          <ProveedorSesion>
            <ProveedorFinanzas>
              <ProveedorPlanificacion>
                <NavegacionRaiz />
              </ProveedorPlanificacion>
            </ProveedorFinanzas>
          </ProveedorSesion>
        </ProveedorIdioma>
      </ProveedorTema>
    </SQLiteProvider>
  );
}

function NavegacionRaiz() {
  const { tema, listo: temaListo } = useTema();
  const { listo: idiomaListo, esRTL } = useIdioma();
  const { t } = useTranslation();
  const [fuentesListas] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });
  const [fuentesDisplayListas] = useFuentesDisplay({
    Fraunces_400Regular,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });
  const [requiereBloqueo, setRequiereBloqueo] = useState<boolean | null>(null);
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [errorDesbloqueo, setErrorDesbloqueo] = useState(false);

  const intentarDesbloquear = useCallback(async () => {
    setErrorDesbloqueo(false);
    const exito = await autenticarConBiometria(t('seguridad.pantallaBloqueo.titulo'));
    if (exito) {
      setDesbloqueado(true);
    } else {
      setErrorDesbloqueo(true);
    }
  }, [t]);

  useEffect(() => {
    bloqueoBiometricoActivado().then((activado) => {
      setRequiereBloqueo(activado);
      if (activado) {
        intentarDesbloquear();
      }
    });
    // Solo debe correr una vez al iniciar la app: el candado se resuelve por sesión,
    // no en cada re-render de este layout raíz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!temaListo || !idiomaListo || !fuentesListas || !fuentesDisplayListas || requiereBloqueo === null) {
    return <View style={{ flex: 1, backgroundColor: '#070A18' }} />;
  }

  if (requiereBloqueo && !desbloqueado) {
    return <PantallaBloqueo error={errorDesbloqueo} onDesbloquear={intentarDesbloquear} />;
  }

  return (
    <ThemeProviderNavegacion value={tema.modo === 'oscuro' ? DarkTheme : DefaultTheme}>
      <Head>
        <title>MiPresupuesto</title>
        <meta name="theme-color" content={tema.colores.fondoPrincipal} />
      </Head>
      <View style={{ flex: 1, direction: esRTL ? 'rtl' : 'ltr' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tema.colores.fondoPrincipal },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="bienvenida" />
          <Stack.Screen name="autenticacion" />
          <Stack.Screen name="configuracion-inicial" />
          <Stack.Screen name="(principal)" />
          <Stack.Screen
            name="movimiento/nuevo"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="movimiento/[id]"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen name="cuenta/index" />
          <Stack.Screen name="cuenta/nueva" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="presupuesto/nuevo" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="meta/nueva" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="meta/[id]" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="reporte/[periodo]" />
          <Stack.Screen name="privacidad" />
        </Stack>
        <StatusBar style={tema.modo === 'oscuro' ? 'light' : 'dark'} />
      </View>
    </ThemeProviderNavegacion>
  );
}
