import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { EncabezadoFormulario } from '@/src/componentes/autenticacion/EncabezadoFormulario';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';
import { useSesion } from '@/src/contextos/ContextoSesion';
import { configuracionInicialEstaCompleta } from '@/src/almacenamiento/configuracionFinancieraInicial';
import { reenviarVerificacion } from '@/src/servicios/supabase/autenticacion';
import { supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

const SEGUNDOS_ESPERA_REENVIO = 30;

export default function PantallaVerificarCorreo() {
  const { tema } = useTema();
  const { usuario } = useSesion();
  const { t } = useTranslation();
  const router = useRouter();
  const { correo } = useLocalSearchParams<{ correo?: string }>();
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_ESPERA_REENVIO);
  const [errorReenvio, setErrorReenvio] = useState<string | undefined>();

  useEffect(() => {
    if (!usuario?.email_confirmed_at && !usuario?.confirmed_at) return;

    let activo = true;
    void (async () => {
      const configuracionCompleta = await configuracionInicialEstaCompleta();
      if (!activo) return;
      router.replace(configuracionCompleta ? '/(principal)/inicio' : '/configuracion-inicial/idioma');
    })();

    return () => {
      activo = false;
    };
  }, [router, usuario]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const temporizador = setTimeout(() => setSegundosRestantes((valor) => valor - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [segundosRestantes]);

  const reenviar = async () => {
    if (segundosRestantes > 0) return;
    setErrorReenvio(undefined);
    if (supabaseEstaConfigurado() && correo) {
      const { error } = await reenviarVerificacion(correo);
      if (error) {
        setErrorReenvio(error);
        return;
      }
    }
    setSegundosRestantes(SEGUNDOS_ESPERA_REENVIO);
  };

  const continuarComoDemostracion = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/configuracion-inicial/idioma');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
          <BlurView
                    intensity={30}
                    tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
                    style={estilos.tarjetaEncabezado}
                  >
                    <EncabezadoFormulario titulo={t('autenticacion.verificarCorreo.titulo')} />
                  </BlurView>
        </Animated.View>

        <View style={[estilos.icono, { backgroundColor: `${tema.colores.violeta}26` }]}>
          <Icono nombre="mark-email-unread" tamano={36} color={tema.colores.violeta} />
        </View>

        <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
          {t('autenticacion.verificarCorreo.descripcion')}
        </Text>
        <Text style={[estilos.correo, { color: tema.colores.textoPrincipal }]}>
          {correo ?? ''}
        </Text>

        <BotonSecundario
          titulo={
            segundosRestantes > 0
              ? t('autenticacion.verificarCorreo.reenviarEn', { segundos: segundosRestantes })
              : t('autenticacion.verificarCorreo.reenviar')
          }
          onPress={reenviar}
          deshabilitado={segundosRestantes > 0}
        />

        {supabaseEstaConfigurado() ? (
          <BotonPrincipal
            titulo={t('autenticacion.verificarCorreo.continuarInicioSesion')}
            onPress={() => router.replace('/autenticacion/iniciar-sesion')}
          />
        ) : null}

        {errorReenvio ? <MensajeError mensaje={errorReenvio} /> : null}

        <View style={estilos.separador} />

        {!supabaseEstaConfigurado() ? (
          <BotonPrincipal
            titulo={t('autenticacion.verificarCorreo.continuarDemostracion')}
            onPress={continuarComoDemostracion}
          />
        ) : null}
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  tarjetaEncabezado: {
    width: '100%',
    borderRadius: 6,
    padding: 12,
    overflow: 'hidden',
  },
  icono: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  descripcion: {
    fontSize: 14,
    textAlign: 'center',
  },
  correo: {
    fontSize: 16,
    fontFamily: FUENTES.negrita,
    marginBottom: 8,
  },
  separador: {
    height: 8,
  },
});
