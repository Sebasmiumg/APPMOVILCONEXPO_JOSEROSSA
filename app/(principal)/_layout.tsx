import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { BarraNavegacionPrincipal } from '@/src/componentes/comunes/BarraNavegacionPrincipal';
import { useSesion } from '@/src/contextos/ContextoSesion';
import { useAnchoVentana } from '@/src/hooks/useAnchoVentana';

export default function LayoutPrincipal() {
  const { puntoQuiebre } = useAnchoVentana();
  const { configurado, usuario, cargando } = useSesion();
  const router = useRouter();

  useEffect(() => {
    if (configurado && !cargando && !usuario) router.replace('/bienvenida');
  }, [configurado, cargando, usuario, router]);

  if (configurado && (cargando || !usuario)) {
    return <View style={{ flex: 1, backgroundColor: '#070A18' }} />;
  }

  return (
    <Tabs
      tabBar={(props) => <BarraNavegacionPrincipal {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: puntoQuiebre === 'movil' ? 'bottom' : 'left',
      }}
    >
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="movimientos" />
      <Tabs.Screen name="asistente" />
      <Tabs.Screen name="analisis" />
      <Tabs.Screen name="metas" />
      <Tabs.Screen name="reinversion" />
      <Tabs.Screen name="capacitaciones" />
      <Tabs.Screen name="frameworks" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
