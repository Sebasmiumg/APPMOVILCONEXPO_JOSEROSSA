import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { Cargador } from '@/src/componentes/comunes/Cargador';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { ProveedorSesionLaravel, useSesionLaravel } from '@/src/contextos/ContextoSesionLaravel';
import { useTema } from '@/src/contextos/ContextoTema';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';

function SolicitarSesionPrincipal({ accesoDenegado }: { accesoDenegado: boolean }) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <LayoutResponsive anchoMaximo={520}>
      <LinearGradient colors={['#123024', '#1F5C3F', '#4BB88A']} style={estilos.banner}>
        <Text style={estilos.insignia}>{t('capacitaciones.fuente')}</Text>
        <Text style={estilos.titulo}>
          {accesoDenegado ? t('capacitaciones.accesoRestringido.titulo') : t('capacitaciones.login.titulo')}
        </Text>
        <Text style={estilos.subtitulo}>
          {accesoDenegado
            ? t('capacitaciones.accesoRestringido.descripcion')
            : t('capacitaciones.login.requiereSesionPrincipal')}
        </Text>
      </LinearGradient>
      {!accesoDenegado ? (
        <View style={estilos.formulario}>
          <BotonPrincipal
            titulo={t('capacitaciones.login.abrirSesionPrincipal')}
            onPress={() => router.push('/autenticacion/iniciar-sesion')}
          />
          <Text style={[estilos.ayuda, { color: tema.colores.textoSecundario }]}>
            {t('capacitaciones.login.descripcion')}
          </Text>
        </View>
      ) : null}
    </LayoutResponsive>
  );
}

function ContenidoCapacitaciones() {
  const { t } = useTranslation();
  const { autenticado, accesoDenegado, verificando } = useSesionLaravel();

  if (verificando) {
    return (
      <LayoutResponsive anchoMaximo={520}>
        <Cargador etiqueta={t('capacitaciones.cargando')} />
      </LayoutResponsive>
    );
  }

  if (!autenticado) return <SolicitarSesionPrincipal accesoDenegado={accesoDenegado} />;

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
