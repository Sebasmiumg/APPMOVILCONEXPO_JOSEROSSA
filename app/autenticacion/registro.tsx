import { zodResolver } from '@hookform/resolvers/zod';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { guardarPreferencia } from '@/src/almacenamiento/preferenciasDispositivo';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { EncabezadoFormulario } from '@/src/componentes/autenticacion/EncabezadoFormulario';
import { TarjetaTipoCorreo } from '@/src/componentes/autenticacion/TarjetaTipoCorreo';
import { CLAVES_ALMACENAMIENTO } from '@/src/constantes/almacenamiento';
import { useTema } from '@/src/contextos/ContextoTema';
import { registrarUsuario } from '@/src/servicios/supabase/autenticacion';
import { supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import { clasificarCorreo } from '@/src/utilidades/clasificarCorreo';
import {
  crearEsquemaRegistro,
  type DatosRegistro,
} from '@/src/validaciones/esquemasAutenticacion';

export default function PantallaRegistro() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | undefined>();

  const esquema = useMemo(() => crearEsquemaRegistro(t), [t]);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombreCompleto: '',
      correo: '',
      contrasena: '',
      confirmarContrasena: '',
      aceptoTerminos: false,
    },
  });

  const correoActual = watch('correo');
  const clasificacion = useMemo(() => clasificarCorreo(correoActual ?? ''), [correoActual]);

  const alEnviar = handleSubmit(async (datos) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnviando(true);
    setErrorServidor(undefined);

    if (supabaseEstaConfigurado()) {
      const { error } = await registrarUsuario(datos.nombreCompleto, datos.correo, datos.contrasena);
      if (error) {
        setEnviando(false);
        setErrorServidor(error);
        return;
      }
    }

    await guardarPreferencia(CLAVES_ALMACENAMIENTO.nombreUsuarioDemo, datos.nombreCompleto);
    await guardarPreferencia(CLAVES_ALMACENAMIENTO.correoUsuarioDemo, datos.correo);
    setEnviando(false);
    router.push({ pathname: '/autenticacion/verificar-correo', params: { correo: datos.correo } });
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
            titulo={t('autenticacion.registro.titulo')}
            subtitulo={t('autenticacion.registro.subtitulo')}
          />
        </BlurView>

        <Controller
          control={control}
          name="nombreCompleto"
          render={({ field: { value, onChange, onBlur } }) => (
            <CampoTexto
              etiqueta={t('autenticacion.registro.nombreCompleto')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.nombreCompleto?.message}
              autoCapitalize="words"
            />
          )}
        />

        <View style={estilos.grupoCorreo}>
          <Controller
            control={control}
            name="correo"
            render={({ field: { value, onChange, onBlur } }) => (
              <CampoTexto
                etiqueta={t('autenticacion.registro.correo')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.correo?.message}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />
          {clasificacion ? <TarjetaTipoCorreo {...clasificacion} /> : null}
        </View>

        <Controller
          control={control}
          name="contrasena"
          render={({ field: { value, onChange, onBlur } }) => (
            <CampoTexto
              etiqueta={t('autenticacion.registro.contrasena')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.contrasena?.message}
              esContrasena
            />
          )}
        />

        <Controller
          control={control}
          name="confirmarContrasena"
          render={({ field: { value, onChange, onBlur } }) => (
            <CampoTexto
              etiqueta={t('autenticacion.registro.confirmarContrasena')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmarContrasena?.message}
              esContrasena
            />
          )}
        />

        <Controller
          control={control}
          name="aceptoTerminos"
          render={({ field: { value, onChange } }) => (
            <Pressable
              onPress={() => onChange(!value)}
              style={estilos.filaTerminos}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: value }}
              accessibilityLabel={t('autenticacion.registro.aceptoTerminos')}
            >
              <View
                style={[
                  estilos.casilla,
                  {
                    borderColor: value ? tema.colores.violeta : tema.colores.borde,
                    backgroundColor: value ? tema.colores.violeta : 'transparent',
                  },
                ]}
              >
                {value ? <Icono nombre="check" tamano={14} color={tema.colores.sobrePrimario} /> : null}
              </View>
              <Text style={[estilos.textoTerminos, { color: tema.colores.textoSecundario }]}>
                {t('autenticacion.registro.aceptoTerminos')}
              </Text>
            </Pressable>
          )}
        />
        {errors.aceptoTerminos ? (
          <Text style={[estilos.errorTerminos, { color: tema.colores.gasto }]}>
            {errors.aceptoTerminos.message}
          </Text>
        ) : null}

        {errorServidor ? <MensajeError mensaje={errorServidor} /> : null}

        <BotonPrincipal titulo={t('autenticacion.registro.boton')} onPress={alEnviar} cargando={enviando} />

        <View style={estilos.piePagina}>
          <Text style={{ color: tema.colores.textoSecundario }}>
            {t('autenticacion.registro.yaTienesCuenta')}{' '}
          </Text>
          <Pressable
            onPress={() => router.replace('/autenticacion/iniciar-sesion')}
            accessibilityRole="button"
            accessibilityLabel={t('autenticacion.registro.irAIniciarSesion')}
          >
            <Text style={{ color: tema.colores.violeta, fontWeight: '700' }}>
              {t('autenticacion.registro.irAIniciarSesion')}
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
  grupoCorreo: {
    gap: 10,
  },
  filaTerminos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  casilla: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoTerminos: {
    flex: 1,
    fontSize: 13,
  },
  errorTerminos: {
    fontSize: 12,
    marginTop: -8,
  },
  piePagina: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
});
