import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { configuracionInicialEstaCompleta } from '@/src/almacenamiento/configuracionFinancieraInicial';
import { EncabezadoFormulario } from '@/src/componentes/autenticacion/EncabezadoFormulario';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';
import { iniciarSesion as iniciarSesionSupabase } from '@/src/servicios/supabase/autenticacion';
import { supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import {
  crearEsquemaInicioSesion,
  type DatosInicioSesion,
} from '@/src/validaciones/esquemasAutenticacion';

export default function PantallaIniciarSesion() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | undefined>();

  const esquema = useMemo(() => crearEsquemaInicioSesion(t), [t]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosInicioSesion>({
    resolver: zodResolver(esquema),
    defaultValues: { correo: '', contrasena: '' },
  });

  const alEnviar = handleSubmit(async (datos) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnviando(true);
    setErrorServidor(undefined);

    if (supabaseEstaConfigurado()) {
      const { error } = await iniciarSesionSupabase(datos.correo, datos.contrasena);
      if (error) {
        setEnviando(false);
        setErrorServidor(error);
        return;
      }
    }

    const completo = await configuracionInicialEstaCompleta();
    setEnviando(false);
    router.replace(completo ? '/(principal)/inicio' : '/configuracion-inicial/idioma');
  });

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <BlurView
          intensity={30}
          tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
          style={estilos.tarjetaEncabezado}
        >
          <EncabezadoFormulario
            titulo={t('autenticacion.iniciarSesion.titulo')}
            subtitulo={t('autenticacion.iniciarSesion.subtitulo')}
          />
        </BlurView>

        <Controller
          control={control}
          name="correo"
          render={({ field: { value, onChange, onBlur } }) => (
            <CampoTexto
              etiqueta={t('autenticacion.iniciarSesion.correo')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.correo?.message}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          )}
        />

        <Controller
          control={control}
          name="contrasena"
          render={({ field: { value, onChange, onBlur } }) => (
            <CampoTexto
              etiqueta={t('autenticacion.iniciarSesion.contrasena')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.contrasena?.message}
              esContrasena
            />
          )}
        />

        <Pressable
          onPress={() => router.push('/autenticacion/recuperar-contrasena')}
          accessibilityRole="button"
          accessibilityLabel={t('autenticacion.iniciarSesion.olvidasteContrasena')}
        >
          <Text style={[estilos.enlace, { color: tema.colores.violeta }]}>
            {t('autenticacion.iniciarSesion.olvidasteContrasena')}
          </Text>
        </Pressable>

        {errorServidor ? <MensajeError mensaje={errorServidor} /> : null}

        <BotonPrincipal titulo={t('autenticacion.iniciarSesion.boton')} onPress={alEnviar} cargando={enviando} />

        <View style={estilos.piePagina}>
          <Text style={{ color: tema.colores.textoSecundario }}>
            {t('autenticacion.iniciarSesion.noTienesCuenta')}{' '}
          </Text>
          <Pressable
            onPress={() => router.replace('/autenticacion/registro')}
            accessibilityRole="button"
            accessibilityLabel={t('autenticacion.iniciarSesion.irARegistro')}
          >
            <Text style={{ color: tema.colores.violeta, fontWeight: '700' }}>
              {t('autenticacion.iniciarSesion.irARegistro')}
            </Text>
          </Pressable>
        </View>
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
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
  },
  enlace: {
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  piePagina: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
});
