import { Tabs } from 'expo-router';

import { BarraNavegacionPrincipal } from '@/src/componentes/comunes/BarraNavegacionPrincipal';
import { useAnchoVentana } from '@/src/hooks/useAnchoVentana';

export default function LayoutPrincipal() {
  const { puntoQuiebre } = useAnchoVentana();

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
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
