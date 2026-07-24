import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import { configuracionInicialEstaCompleta } from '@/src/almacenamiento/configuracionFinancieraInicial';
import { useTema } from '@/src/contextos/ContextoTema';

const DURACION_MINIMA_MS = 1100;

export default function PantallaSplash() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const rotacion = useSharedValue(0);

  useEffect(() => {
    rotacion.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
  }, [rotacion]);

  useEffect(() => {
    let activo = true;
    const inicio = Date.now();

    (async () => {
      const completo = await configuracionInicialEstaCompleta();
      const transcurrido = Date.now() - inicio;
      const espera = Math.max(0, DURACION_MINIMA_MS - transcurrido);
      setTimeout(() => {
        if (!activo) return;
        router.replace(completo ? '/(principal)/inicio' : '/bienvenida');
      }, espera);
    })();

    return () => {
      activo = false;
    };
  }, [router]);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotacion.value}deg` }],
  }));

  return (
    <View style={[estilos.contenedor, { backgroundColor: tema.colores.fondoPrincipal }]}>
      <LinearGradient
        colors={[`${tema.colores.violeta}33`, 'transparent']}
        style={estilos.resplandor}
      />
      <Animated.View style={estiloAnimado}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          <Defs>
            <SvgLinearGradient id="anilloAurora" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={tema.colores.rosa} />
              <Stop offset="0.5" stopColor={tema.colores.violeta} />
              <Stop offset="1" stopColor={tema.colores.azul} />
            </SvgLinearGradient>
          </Defs>
          <Circle
            cx="60"
            cy="60"
            r="50"
            stroke="url(#anilloAurora)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="240 90"
            fill="none"
          />
        </Svg>
      </Animated.View>
      <BlurView
        intensity={30}
        tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
        style={estilos.tarjetaTexto}
      >
        <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]}>MiPresupuesto</Text>
        <Text style={[estilos.eslogan, { color: tema.colores.textoSecundario }]}>{t('splash.eslogan')}</Text>
      </BlurView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  resplandor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  tarjetaTexto: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  nombre: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
  },
  eslogan: {
    fontSize: 14,
  },
});
