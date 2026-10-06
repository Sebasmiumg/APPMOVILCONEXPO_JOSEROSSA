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
import { ProveedorSesionLaravel, useSesionLaravel } from '@/src/contextos/ContextoSesionLaravel';
import { useTema } from '@/src/contextos/ContextoTema';
import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';

function PantallaLogin() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { iniciarSesion } = useSesionLaravel();

  const [email, setEmail] = useState('ana.lopez@example.com');
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
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPILaravel ? fallo.codigo : 'respuesta';
      setError(t(`capacitaciones.errores.${codigo}`));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutResponsive anchoMaximo={520}>
      <LinearGradient colors={['#123024', '#1F5C3F', '#4BB88A']} style={estilos.banner}>
        <Text style={estilos.insignia}>{t('capacitaciones.fuente')}</Text>
        <Text style={estilos.titulo}>{t('capacitaciones.login.titulo')}</Text>
        <Text style={estilos.subtitulo}>{t('capacitaciones.login.descripcion')}</Text>
      </LinearGradient>

      <View style={estilos.formulario}>
        <CampoTexto
          etiqueta={t('capacitaciones.login.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <CampoTexto
          etiqueta={t('capacitaciones.login.password')}
          value={password}
          onChangeText={setPassword}
          esContrasena
        />
        {error ? <MensajeError mensaje={error} /> : null}
        <BotonPrincipal titulo={t('capacitaciones.login.entrar')} onPress={entrar} cargando={enviando} />
        <Text style={[estilos.ayuda, { color: tema.colores.textoSecundario }]}>
          {t('capacitaciones.login.ayuda')}
        </Text>
      </View>
    </LayoutResponsive>
  );
}

function ContenidoCapacitaciones() {
  const { t } = useTranslation();
  const { autenticado, verificando } = useSesionLaravel();

  if (verificando) {
    return (
      <LayoutResponsive anchoMaximo={520}>
        <Cargador etiqueta={t('capacitaciones.cargando')} />
      </LayoutResponsive>
    );
  }

  if (!autenticado) {
    return <PantallaLogin />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function LayoutCapacitaciones() {
  return (
    <ProveedorSesionLaravel>
      <ContenidoCapacitaciones />
    </ProveedorSesionLaravel>
  );
}

const estilos = StyleSheet.create({
  banner: { borderRadius: 8, padding: 20, gap: 7, marginTop: 20 },
  insignia: { color: '#C9F2DE', fontSize: 12, letterSpacing: 1, fontFamily: FUENTES.negrita },
  titulo: { color: '#FFFFFF', fontSize: 26, fontFamily: FUENTE_DISPLAY.negrita },
  subtitulo: { color: '#DCF5E9', fontSize: 14, lineHeight: 20 },
  formulario: { gap: 14, marginTop: 20 },
  ayuda: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
