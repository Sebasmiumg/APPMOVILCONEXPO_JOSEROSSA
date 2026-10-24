import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Cargador } from '@/src/componentes/comunes/Cargador';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { FilaMenu } from '@/src/componentes/comunes/FilaMenu';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useSesionFrameworks } from '@/src/contextos/ContextoSesionFrameworks';
import { useTema } from '@/src/contextos/ContextoTema';
import { ErrorFrameworks, listarFrameworks, listarLanguages } from '@/src/servicios/frameworksSupabase/frameworks';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import type { FrameworkAPI, LanguageAPI } from '@/src/tipos/frameworksSupabase';

export default function PantallaFrameworks() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { correo, cerrarSesion } = useSesionFrameworks();

  const [idiomas, setIdiomas] = useState<LanguageAPI[]>([]);
  const [frameworks, setFrameworks] = useState<FrameworkAPI[]>([]);
  const [filtroLenguaje, setFiltroLenguaje] = useState<string | undefined>(undefined);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarFrameworks = useCallback(
    async (lenguaje?: string) => {
      setCargando(true);
      setError(null);
      try {
        setFrameworks(await listarFrameworks(lenguaje));
      } catch (fallo) {
        const codigo = fallo instanceof ErrorFrameworks ? fallo.codigo : 'error';
        setError(t(`frameworks.errores.${codigo}`));
      } finally {
        setCargando(false);
      }
    },
    [t]
  );

  useEffect(() => {
    listarLanguages()
      .then(setIdiomas)
      .catch(() => setIdiomas([]));
  }, []);

  useEffect(() => {
    cargarFrameworks(filtroLenguaje);
  }, [filtroLenguaje, cargarFrameworks]);

  const seleccionarFiltro = (idLenguaje: string | undefined) => {
    setFiltroLenguaje(idLenguaje);
  };

  return (
    <LayoutResponsive anchoMaximo={820}>
      <LinearGradient colors={['#1A1033', '#3B1E6D', '#7C4DFF']} style={estilos.banner}>
        <Text style={estilos.insignia}>{t('frameworks.fuente')}</Text>
        <Text style={estilos.titulo}>{t('frameworks.titulo')}</Text>
        <Text style={estilos.subtitulo}>{t('frameworks.descripcion')}</Text>
        {correo ? <Text style={estilos.subtitulo}>{correo}</Text> : null}
      </LinearGradient>

      <View style={estilos.menu}>
        <FilaMenu
          titulo={t('frameworks.registrar.titulo')}
          icono="add-circle-outline"
          onPress={() => router.push('/frameworks/nuevo' as Href)}
        />
        <FilaMenu titulo={t('frameworks.cerrarSesion')} icono="logout" onPress={cerrarSesion} />
      </View>

      <Text style={[estilos.subtituloSeccion, { color: tema.colores.textoPrincipal }]}>
        {t('frameworks.filtro.titulo')}
      </Text>
      <View style={estilos.filaChips}>
        <ChipCategoria
          etiqueta={t('frameworks.filtro.todos')}
          seleccionado={filtroLenguaje === undefined}
          onPress={() => seleccionarFiltro(undefined)}
        />
        {idiomas.map((idioma) => (
          <ChipCategoria
            key={idioma.id}
            etiqueta={idioma.name}
            seleccionado={filtroLenguaje === idioma.id}
            onPress={() => seleccionarFiltro(idioma.id)}
          />
        ))}
      </View>

      {cargando ? <Cargador etiqueta={t('frameworks.cargando')} /> : null}
      {error ? (
        <MensajeError
          mensaje={error}
          etiquetaReintentar={t('comun.reintentar')}
          onReintentar={() => cargarFrameworks(filtroLenguaje)}
        />
      ) : null}

      {!cargando && !error && frameworks.length === 0 ? (
        <EstadoVacio icono="widgets" titulo={t('frameworks.sinDatos')} />
      ) : null}

      {frameworks.map((framework) => (
        <TarjetaCristal key={framework.id} estilo={estilos.tarjeta}>
          <View style={estilos.encabezadoTarjeta}>
            <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]}>{framework.name}</Text>
            {framework.languages ? (
              <ChipCategoria etiqueta={framework.languages.name} />
            ) : null}
          </View>
          {framework.tagline ? (
            <Text style={[estilos.tagline, { color: tema.colores.textoSecundario }]}>{framework.tagline}</Text>
          ) : null}
          {framework.description ? (
            <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
              {framework.description}
            </Text>
          ) : null}
          <Text style={[estilos.meta, { color: tema.colores.textoSecundario }]}>
            {[framework.creator, framework.year].filter(Boolean).join(' · ')}
          </Text>
          {framework.key_features.length > 0 ? (
            <View style={estilos.listaFeatures}>
              {framework.key_features.map((caracteristica) => (
                <Text key={caracteristica} style={[estilos.feature, { color: tema.colores.textoPrincipal }]}>
                  • {caracteristica}
                </Text>
              ))}
            </View>
          ) : null}
        </TarjetaCristal>
      ))}
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  banner: { borderRadius: 8, padding: 20, gap: 7 },
  insignia: { color: '#D9C9FF', fontSize: 12, letterSpacing: 1, fontFamily: FUENTES.negrita },
  titulo: { color: '#FFFFFF', fontSize: 26, fontFamily: FUENTE_DISPLAY.negrita },
  subtitulo: { color: '#E6DBFF', fontSize: 14, lineHeight: 20 },
  menu: { gap: 10 },
  subtituloSeccion: { fontSize: 16, fontFamily: FUENTES.seminegrita, marginTop: 8 },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tarjeta: { gap: 8 },
  encabezadoTarjeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nombre: { fontSize: 17, fontFamily: FUENTES.negrita },
  tagline: { fontSize: 13, fontFamily: FUENTES.seminegrita },
  descripcion: { fontSize: 13, lineHeight: 19 },
  meta: { fontSize: 12 },
  listaFeatures: { gap: 2, marginTop: 4 },
  feature: { fontSize: 12, lineHeight: 18 },
});
