import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { EncabezadoFormulario } from '@/src/componentes/autenticacion/EncabezadoFormulario';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';
import { recuperarContrasena as recuperarContrasenaSupabase } from '@/src/servicios/supabase/autenticacion';
import { supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import {
  crearEsquemaRecuperarContrasena,
  type DatosRecuperarContrasena,
} from '@/src/validaciones/esquemasAutenticacion';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

export default function PantallaRecuperarContrasena() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | undefined>();

  const esquema = useMemo(() => crearEsquemaRecuperarContrasena(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosRecuperarContrasena>({
    resolver: zodResolver(esquema),
    defaultValues: { correo: '' },
  });

  const alEnviar = handleSubmit(async (datos) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnviando(true);
    setErrorServidor(undefined);

    if (supabaseEstaConfigurado()) {
      const { error } = await recuperarContrasenaSupabase(datos.correo);
      if (error) {
        setEnviando(false);
        setErrorServidor(error);
        return;
      }
    } else {
      // Sin Supabase configurado, se confirma localmente para no dejar el flujo sin respuesta.
      await new Promise((resolver) => setTimeout(resolver, 600));
    }

    setEnviando(false);
    setEnviado(true);
  });

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
          <BlurView
                    intensity={30}
                    tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
                    style={estilos.tarjetaEncabezado}
                  >
                    <EncabezadoFormulario
                      titulo={t('autenticacion.recuperarContrasena.titulo')}
                      subtitulo={t('autenticacion.recuperarContrasena.subtitulo')}
                    />
                  </BlurView>
        </Animated.View>

        {enviado ? (
          <View
            style={[
              estilos.confirmacion,
              { borderRadius: tema.radios.tarjeta, borderColor: tema.colores.ingreso, backgroundColor: `${tema.colores.ingreso}1A` },
            ]}
          >
            <Icono nombre="mark-email-read" tamano={22} color={tema.colores.ingreso} />
            <Text style={[estilos.textoConfirmacion, { color: tema.colores.textoPrincipal }]}>
              {t('autenticacion.verificarCorreo.descripcion')}
            </Text>
          </View>
        ) : (
          <Controller
            control={control}
            name="correo"
            render={({ field: { value, onChange, onBlur } }) => (
              <CampoTexto
                etiqueta={t('autenticacion.recuperarContrasena.correo')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.correo?.message}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />
        )}

        {errorServidor ? <MensajeError mensaje={errorServidor} /> : null}

        {!enviado ? (
          <BotonPrincipal
            titulo={t('autenticacion.recuperarContrasena.boton')}
            onPress={alEnviar}
            cargando={enviando}
          />
        ) : null}

        <Pressable
          onPress={() => router.replace('/autenticacion/iniciar-sesion')}
          style={estilos.piePagina}
          accessibilityRole="button"
          accessibilityLabel={t('autenticacion.recuperarContrasena.volverAIniciarSesion')}
          hitSlop={8}
        >
          <Text style={{ color: tema.colores.violeta, fontFamily: FUENTES.negrita }}>
            {t('autenticacion.recuperarContrasena.volverAIniciarSesion')}
          </Text>
        </Pressable>
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 12,
  },
  tarjetaEncabezado: {
    borderRadius: 6,
    padding: 12,
    overflow: 'hidden',
  },
  confirmacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 16,
  },
  textoConfirmacion: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  piePagina: {
    alignItems: 'center',
    marginTop: 8,
  },
});
