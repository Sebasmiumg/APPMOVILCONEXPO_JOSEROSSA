import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';
import { useAnchoVentana } from '@/src/hooks/useAnchoVentana';
import { DESTINOS_NAVEGACION } from '@/src/constantes/navegacion';

export function BarraNavegacionPrincipal({ state, navigation }: BottomTabBarProps) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { puntoQuiebre } = useAnchoVentana();
  const insets = useSafeAreaInsets();

  const rutaActiva = state.routes[state.index]?.name;

  const irA = (nombreRuta: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    navigation.navigate(nombreRuta);
  };

  const abrirAgregar = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/movimiento/nuevo');
  };

  if (puntoQuiebre !== 'movil') {
    return (
      <View
        style={[
          estilos.barraLateral,
          { backgroundColor: tema.colores.fondoSecundario, borderColor: tema.colores.borde, paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={[estilos.marcaLateral, { color: tema.colores.textoPrincipal }]}>MiPresupuesto</Text>

        <Pressable
          onPress={abrirAgregar}
          accessibilityRole="button"
          accessibilityLabel={t('navegacion.agregar')}
          style={estilos.botonAgregarLateral}
        >
          <LinearGradient colors={tema.gradientePrincipal} style={estilos.gradienteAgregarLateral}>
            <Icono nombre="add" tamano={20} color={tema.colores.sobrePrimario} />
            <Text style={estilos.textoAgregarLateral}>{t('navegacion.agregar')}</Text>
          </LinearGradient>
        </Pressable>

        {DESTINOS_NAVEGACION.map((destino) => {
          const activo = rutaActiva === destino.ruta;
          return (
            <Pressable
              key={destino.clave}
              onPress={() => irA(destino.ruta)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={t(destino.claveTraduccion)}
              style={[
                estilos.itemLateral,
                { backgroundColor: activo ? `${tema.colores.violeta}1F` : 'transparent' },
              ]}
            >
              <Icono
                nombre={destino.icono}
                tamano={20}
                color={activo ? tema.colores.violeta : tema.colores.textoSecundario}
              />
              <Text
                style={[
                  estilos.textoLateral,
                  { color: activo ? tema.colores.violeta : tema.colores.textoSecundario },
                ]}
              >
                {t(destino.claveTraduccion)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const destinosDock = DESTINOS_NAVEGACION.filter((destino) => destino.enDockMovil);
  const mitad = Math.ceil(destinosDock.length / 2);
  const izquierda = destinosDock.slice(0, mitad);
  const derecha = destinosDock.slice(mitad);

  return (
    <View
      style={[
        estilos.dock,
        { backgroundColor: tema.colores.fondoSecundario, borderColor: tema.colores.borde, paddingBottom: insets.bottom || 12 },
      ]}
    >
      {[...izquierda, { fab: true } as const, ...derecha].map((item, indice) =>
        'fab' in item ? (
          <Pressable
            key="fab"
            onPress={abrirAgregar}
            accessibilityRole="button"
            accessibilityLabel={t('navegacion.agregar')}
            style={estilos.contenedorFab}
          >
            <LinearGradient colors={tema.gradientePrincipal} style={estilos.fab}>
              <Icono nombre="add" tamano={26} color={tema.colores.sobrePrimario} />
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            key={item.clave}
            onPress={() => irA(item.ruta)}
            accessibilityRole="tab"
            accessibilityState={{ selected: rutaActiva === item.ruta }}
            accessibilityLabel={t(item.claveTraduccion)}
            style={estilos.itemDock}
          >
            <Icono
              nombre={item.icono}
              tamano={22}
              color={rutaActiva === item.ruta ? tema.colores.violeta : tema.colores.textoSecundario}
            />
            <Text
              style={[
                estilos.textoDock,
                { color: rutaActiva === item.ruta ? tema.colores.violeta : tema.colores.textoSecundario },
              ]}
              numberOfLines={1}
            >
              {t(item.claveTraduccion)}
            </Text>
          </Pressable>
        )
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  itemDock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  textoDock: {
    fontSize: 11,
    fontWeight: '600',
  },
  contenedorFab: {
    marginTop: -28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  barraLateral: {
    width: 220,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    gap: 6,
  },
  marcaLateral: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  botonAgregarLateral: {
    marginBottom: 16,
  },
  gradienteAgregarLateral: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
  },
  textoAgregarLateral: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  itemLateral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  textoLateral: {
    fontSize: 14,
    fontWeight: '600',
  },
});
