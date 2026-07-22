import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnchoVentana } from '@/src/hooks/useAnchoVentana';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesLayoutResponsive {
  children: ReactNode;
  conDesplazamiento?: boolean;
  anchoMaximo?: number;
}

export function LayoutResponsive({
  children,
  conDesplazamiento = true,
  anchoMaximo = 1100,
}: PropiedadesLayoutResponsive) {
  const { tema } = useTema();
  const { puntoQuiebre } = useAnchoVentana();
  const insets = useSafeAreaInsets();
  const esAncho = puntoQuiebre !== 'movil';

  const contenido = (
    <View
      style={[
        estilos.contenido,
        {
          maxWidth: esAncho ? anchoMaximo : undefined,
          paddingHorizontal: esAncho ? 32 : 16,
          flex: conDesplazamiento ? undefined : 1,
        },
      ]}
    >
      {children}
    </View>
  );

  if (!conDesplazamiento) {
    return (
      <View
        style={[
          estilos.raiz,
          estilos.raizSinDesplazamiento,
          { backgroundColor: tema.colores.fondoPrincipal, paddingTop: insets.top },
        ]}
      >
        {contenido}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: tema.colores.fondoPrincipal }}
      contentContainerStyle={[estilos.raiz, { paddingTop: insets.top }]}
    >
      {contenido}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  raizSinDesplazamiento: {
    flex: 1,
    paddingBottom: 0,
  },
  contenido: {
    width: '100%',
    gap: 16,
  },
});
