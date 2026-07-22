import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { EncabezadoFormulario } from '@/src/componentes/autenticacion/EncabezadoFormulario';
import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';
import { reenviarVerificacion } from '@/src/servicios/supabase/autenticacion';
import { supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';

const SEGUNDOS_ESPERA_REENVIO = 30;

export default function PantallaVerificarCorreo() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { correo } = useLocalSearchParams<{ correo?: string }>();
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_ESPERA_REENVIO);
  const [errorReenvio, setErrorReenvio] = useState<string | undefined>();

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
    router.replace('/configuracion-inicial/idioma');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <EncabezadoFormulario titulo={t('autenticacion.verificarCorreo.titulo')} />

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

        {errorReenvio ? <MensajeError mensaje={errorReenvio} /> : null}

        <View style={estilos.separador} />

        <BotonPrincipal
          titulo={t('autenticacion.verificarCorreo.continuarDemostracion')}
          onPress={continuarComoDemostracion}
        />
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
  icono: {
    width: 80,
    height: 80,
    borderRadius: 24,
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
    fontWeight: '700',
    marginBottom: 8,
  },
  separador: {
    height: 8,
  },
});
