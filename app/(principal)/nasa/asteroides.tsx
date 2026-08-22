import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { Cargador } from '@/src/componentes/comunes/Cargador';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';
import { ErrorAPINASA, obtenerAsteroidesCercanos } from '@/src/servicios/nasa/apiNASA';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import type { AsteroideCercanoNASA } from '@/src/tipos/nasa';

function fechaLocalISO(): string {
  const ahora = new Date();
  const desplazamiento = ahora.getTimezoneOffset() * 60_000;
  return new Date(ahora.getTime() - desplazamiento).toISOString().slice(0, 10);
}

export default function PantallaAsteroidesNASA() {
  const { tema } = useTema();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const fecha = useMemo(fechaLocalISO, []);
  const [asteroides, setAsteroides] = useState<AsteroideCercanoNASA[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setAsteroides(await obtenerAsteroidesCercanos(fecha));
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPINASA ? fallo.codigo : 'respuesta';
      setError(t(`nasa.errores.${codigo}`));
    } finally {
      setCargando(false);
    }
  }, [fecha, t]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const formatoNumero = useMemo(() => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 }), [i18n.language]);
  const peligrosos = asteroides.filter((asteroide) => asteroide.peligroso).length;

  return (
    <LayoutResponsive anchoMaximo={820}>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('comun.atras')} style={estilos.volver}>
        <Icono nombre="arrow-back" tamano={20} color={tema.colores.textoPrincipal} />
        <Text style={[estilos.textoVolver, { color: tema.colores.textoPrincipal }]}>{t('comun.atras')}</Text>
      </Pressable>

      <LinearGradient colors={['#30104F', '#6B246F', '#A44B67']} style={estilos.banner}>
        <Text style={estilos.insignia}>NEOWS · {fecha}</Text>
        <Text style={estilos.titulo}>{t('nasa.asteroides.titulo')}</Text>
        <Text style={estilos.subtitulo}>{t('nasa.asteroides.descripcion')}</Text>
      </LinearGradient>

      {cargando ? <Cargador etiqueta={t('nasa.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {!cargando && !error ? (
        <View style={estilos.resumen}>
          <View style={[estilos.metrica, { backgroundColor: tema.colores.tarjeta }]}>
            <Text style={[estilos.valorMetrica, { color: tema.colores.textoPrincipal }]}>{asteroides.length}</Text>
            <Text style={[estilos.etiquetaMetrica, { color: tema.colores.textoSecundario }]}>{t('nasa.asteroides.detectados')}</Text>
          </View>
          <View style={[estilos.metrica, { backgroundColor: tema.colores.tarjeta }]}>
            <Text style={[estilos.valorMetrica, { color: peligrosos ? tema.colores.gasto : tema.colores.ingreso }]}>{peligrosos}</Text>
            <Text style={[estilos.etiquetaMetrica, { color: tema.colores.textoSecundario }]}>{t('nasa.asteroides.potencialmentePeligrosos')}</Text>
          </View>
        </View>
      ) : null}

      {asteroides.map((asteroide) => (
        <View key={asteroide.id} style={[estilos.tarjeta, { backgroundColor: tema.colores.tarjeta, borderColor: tema.colores.borde }]}>
          <View style={estilos.filaTitulo}>
            <Icono nombre="public" tamano={22} color={asteroide.peligroso ? tema.colores.gasto : tema.colores.violeta} />
            <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]}>{asteroide.nombre}</Text>
          </View>
          <Text style={{ color: asteroide.peligroso ? tema.colores.gasto : tema.colores.ingreso, fontFamily: FUENTES.seminegrita }}>
            {asteroide.peligroso ? t('nasa.asteroides.peligroso') : t('nasa.asteroides.noPeligroso')}
          </Text>
          <Text style={[estilos.detalle, { color: tema.colores.textoSecundario }]}>
            {t('nasa.asteroides.diametro')}: {formatoNumero.format(asteroide.diametroMinimoMetros)}–{formatoNumero.format(asteroide.diametroMaximoMetros)} m
          </Text>
          <Text style={[estilos.detalle, { color: tema.colores.textoSecundario }]}>
            {t('nasa.asteroides.distancia')}: {formatoNumero.format(asteroide.distanciaKilometros)} km
          </Text>
          <Text style={[estilos.detalle, { color: tema.colores.textoSecundario }]}>
            {t('nasa.asteroides.velocidad')}: {formatoNumero.format(asteroide.velocidadKilometrosHora)} km/h
          </Text>
          <BotonSecundario titulo={t('nasa.asteroides.verFicha')} onPress={() => Linking.openURL(asteroide.urlNASA)} />
        </View>
      ))}

      <Text style={[estilos.fuente, { color: tema.colores.textoSecundario }]}>{t('nasa.fuente')}</Text>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  volver: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  textoVolver: { fontFamily: FUENTES.seminegrita },
  banner: { borderRadius: 8, padding: 20, gap: 7 },
  insignia: { color: '#F2B7E5', fontSize: 12, letterSpacing: 1.5, fontFamily: FUENTES.negrita },
  titulo: { color: '#FFFFFF', fontSize: 28, fontFamily: FUENTE_DISPLAY.negrita },
  subtitulo: { color: '#F7DDF2', fontSize: 14, lineHeight: 20 },
  resumen: { flexDirection: 'row', gap: 12 },
  metrica: { flex: 1, borderRadius: 6, padding: 14, gap: 4 },
  valorMetrica: { fontSize: 26, fontFamily: FUENTE_DISPLAY.negrita },
  etiquetaMetrica: { fontSize: 12, lineHeight: 16 },
  tarjeta: { borderRadius: 8, padding: 16, borderWidth: StyleSheet.hairlineWidth, gap: 9 },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  nombre: { flex: 1, fontSize: 18, fontFamily: FUENTE_DISPLAY.negrita },
  detalle: { fontSize: 13 },
  fuente: { fontSize: 11, textAlign: 'center', paddingBottom: 8 },
});

