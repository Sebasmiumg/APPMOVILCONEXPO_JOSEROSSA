import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { Cargador } from '@/src/componentes/comunes/Cargador';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { ProveedorSesionFrameworks, useSesionFrameworks } from '@/src/contextos/ContextoSesionFrameworks';
import { useTema } from '@/src/contextos/ContextoTema';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';

function PantallaLogin() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { iniciarSesion } = useSesionFrameworks();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrar = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('validaciones.campoRequerido'));
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch {
      setError(t('frameworks.errores.login'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutResponsive anchoMaximo={520}>
      <LinearGradient colors={['#1A1033', '#3B1E6D', '#7C4DFF']} style={estilos.banner}>
        <Text style={estilos.insignia}>{t('frameworks.fuente')}</Text>
        <Text style={estilos.titulo}>{t('frameworks.login.titulo')}</Text>
        <Text style={estilos.subtitulo}>{t('frameworks.login.descripcion')}</Text>
      </LinearGradient>

      <View style={estilos.formulario}>
        <CampoTexto
          etiqueta={t('frameworks.login.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <CampoTexto
          etiqueta={t('frameworks.login.password')}
          value={password}
          onChangeText={setPassword}
          esContrasena
        />
        {error ? <MensajeError mensaje={error} /> : null}
        <BotonPrincipal titulo={t('frameworks.login.entrar')} onPress={entrar} cargando={enviando} />
      </View>
    </LayoutResponsive>
  );
}

function ContenidoFrameworks() {
  const { t } = useTranslation();
  const { autenticado, verificando } = useSesionFrameworks();

  if (verificando) {
    return (
      <LayoutResponsive anchoMaximo={520}>
        <Cargador etiqueta={t('frameworks.cargando')} />
      </LayoutResponsive>
    );
  }

  if (!autenticado) {
    return <PantallaLogin />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function LayoutFrameworks() {
  return (
    <ProveedorSesionFrameworks>
      <ContenidoFrameworks />
    </ProveedorSesionFrameworks>
  );
}

const estilos = StyleSheet.create({
  banner: { borderRadius: 8, padding: 20, gap: 7, marginTop: 20 },
  insignia: { color: '#D9C9FF', fontSize: 12, letterSpacing: 1, fontFamily: FUENTES.negrita },
  titulo: { color: '#FFFFFF', fontSize: 26, fontFamily: FUENTE_DISPLAY.negrita },
  subtitulo: { color: '#E6DBFF', fontSize: 14, lineHeight: 20 },
  formulario: { gap: 14, marginTop: 20 },
});
