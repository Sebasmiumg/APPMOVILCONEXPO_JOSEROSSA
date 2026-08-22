import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { Cargador } from '@/src/componentes/comunes/Cargador';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';
import { ErrorAPINASA, obtenerImagenAstronomicaDelDia } from '@/src/servicios/nasa/apiNASA';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import type { ImagenAstronomicaNASA } from '@/src/tipos/nasa';

export default function PantallaImagenNASA() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const [imagen, setImagen] = useState<ImagenAstronomicaNASA | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setImagen(await obtenerImagenAstronomicaDelDia());
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPINASA ? fallo.codigo : 'respuesta';
      setError(t(`nasa.errores.${codigo}`));
    } finally {
      setCargando(false);
    }
  }, [t]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const urlVisual = imagen?.media_type === 'video' ? imagen.thumbnail_url : imagen?.url;

  return (
    <LayoutResponsive anchoMaximo={820}>
      <LinearGradient colors={['#071A3D', '#123A70', '#6B4BB8']} style={estilos.banner}>
        <Text style={estilos.insignia}>NASA OPEN APIs</Text>
        <Text style={estilos.titulo}>{t('nasa.apod.titulo')}</Text>
        <Text style={estilos.subtitulo}>{t('nasa.apod.descripcion')}</Text>
      </LinearGradient>

      {cargando ? <Cargador etiqueta={t('nasa.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {imagen ? (
        <View style={[estilos.tarjeta, { backgroundColor: tema.colores.tarjeta, borderColor: tema.colores.borde }]}>
          {urlVisual ? <Image source={{ uri: urlVisual }} style={estilos.imagen} contentFit="cover" transition={250} /> : null}
          <View style={estilos.contenido}>
            <Text style={[estilos.fecha, { color: tema.colores.violeta }]}>{imagen.date}</Text>
            <Text style={[estilos.tituloImagen, { color: tema.colores.textoPrincipal }]}>{imagen.title}</Text>
            {imagen.copyright ? (
              <Text style={[estilos.autor, { color: tema.colores.textoSecundario }]}>© {imagen.copyright}</Text>
            ) : null}
            <Text style={[estilos.explicacion, { color: tema.colores.textoSecundario }]}>{imagen.explanation}</Text>
            {imagen.media_type === 'video' ? (
              <BotonSecundario titulo={t('nasa.apod.verVideo')} onPress={() => Linking.openURL(imagen.url)} />
            ) : null}
          </View>
        </View>
      ) : null}

      <BotonPrincipal titulo={t('nasa.apod.verAsteroides')} onPress={() => router.push('/nasa/asteroides' as Href)} />
      <Text style={[estilos.fuente, { color: tema.colores.textoSecundario }]}>{t('nasa.fuente')}</Text>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  banner: { borderRadius: 8, padding: 20, gap: 7 },
  insignia: { color: '#9FC7FF', fontSize: 12, letterSpacing: 1.8, fontFamily: FUENTES.negrita },
  titulo: { color: '#FFFFFF', fontSize: 28, fontFamily: FUENTE_DISPLAY.negrita },
  subtitulo: { color: '#D7E7FF', fontSize: 14, lineHeight: 20 },
  tarjeta: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  imagen: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#071A3D' },
  contenido: { padding: 18, gap: 10 },
  fecha: { fontSize: 12, fontFamily: FUENTES.negrita },
  tituloImagen: { fontSize: 22, fontFamily: FUENTE_DISPLAY.negrita },
  autor: { fontSize: 12 },
  explicacion: { fontSize: 14, lineHeight: 22 },
  fuente: { fontSize: 11, textAlign: 'center', paddingBottom: 8 },
});
