import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';
import { crearFramework, ErrorFrameworks, listarLanguages } from '@/src/servicios/frameworksSupabase/frameworks';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import type { LanguageAPI } from '@/src/tipos/frameworksSupabase';

function textoALista(texto: string): string[] {
  return texto
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);
}

export default function PantallaNuevoFramework() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();

  const [idiomas, setIdiomas] = useState<LanguageAPI[]>([]);
  const [idiomaId, setIdiomaId] = useState<string | undefined>();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');
  const [creator, setCreator] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [curiosity, setCuriosity] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [useCases, setUseCases] = useState('');

  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const cargarIdiomas = useCallback(async () => {
    try {
      const datos = await listarLanguages();
      setIdiomas(datos);
      setIdiomaId((actual) => actual ?? datos[0]?.id);
    } catch {
      setIdiomas([]);
    }
  }, []);

  useEffect(() => {
    cargarIdiomas();
  }, [cargarIdiomas]);

  const registrar = async () => {
    if (!name.trim() || !idiomaId) {
      setErrorFormulario(t('validaciones.campoRequerido'));
      return;
    }

    setErrorFormulario(undefined);
    setEnviando(true);
    try {
      await crearFramework({
        name: name.trim(),
        language_id: idiomaId,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        year: year ? Number.parseInt(year, 10) : undefined,
        creator: creator.trim() || undefined,
        docs_url: docsUrl.trim() || undefined,
        curiosity: curiosity.trim() || undefined,
        key_features: textoALista(keyFeatures),
        use_cases: textoALista(useCases),
      });
      volverOIrA(router, '/(principal)/frameworks');
    } catch (fallo) {
      const codigo = fallo instanceof ErrorFrameworks ? fallo.codigo : 'error';
      setErrorFormulario(t(`frameworks.errores.${codigo}`));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutResponsive anchoMaximo={820}>
      <View style={estilos.encabezado}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
          {t('frameworks.registrar.titulo')}
        </Text>
        <Pressable
          onPress={() => volverOIrA(router, '/(principal)/frameworks')}
          accessibilityRole="button"
          accessibilityLabel={t('comun.cerrar')}
          hitSlop={12}
        >
          <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
        </Pressable>
      </View>
      <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
        {t('frameworks.registrar.descripcion')}
      </Text>

      <CampoTexto etiqueta={t('frameworks.campos.name')} value={name} onChangeText={setName} />

      <View style={estilos.grupo}>
        <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
          {t('frameworks.campos.lenguaje')}
        </Text>
        <View style={estilos.filaChips}>
          {idiomas.map((idioma) => (
            <ChipCategoria
              key={idioma.id}
              etiqueta={idioma.name}
              seleccionado={idiomaId === idioma.id}
              onPress={() => setIdiomaId(idioma.id)}
            />
          ))}
        </View>
      </View>

      <CampoTexto etiqueta={t('frameworks.campos.tagline')} value={tagline} onChangeText={setTagline} />
      <CampoTexto
        etiqueta={t('frameworks.campos.description')}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <CampoTexto
        etiqueta={t('frameworks.campos.year')}
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
      />
      <CampoTexto etiqueta={t('frameworks.campos.creator')} value={creator} onChangeText={setCreator} />
      <CampoTexto etiqueta={t('frameworks.campos.docsUrl')} value={docsUrl} onChangeText={setDocsUrl} autoCapitalize="none" />
      <CampoTexto etiqueta={t('frameworks.campos.curiosity')} value={curiosity} onChangeText={setCuriosity} multiline />
      <CampoTexto
        etiqueta={t('frameworks.campos.keyFeatures')}
        value={keyFeatures}
        onChangeText={setKeyFeatures}
        multiline
        placeholder={t('frameworks.campos.unaPorLinea')}
      />
      <CampoTexto
        etiqueta={t('frameworks.campos.useCases')}
        value={useCases}
        onChangeText={setUseCases}
        multiline
        placeholder={t('frameworks.campos.unaPorLinea')}
      />

      {errorFormulario ? <MensajeError mensaje={errorFormulario} /> : null}

      <BotonPrincipal
        titulo={t('frameworks.registrar.crear')}
        onPress={registrar}
        cargando={enviando}
        deshabilitado={idiomas.length === 0}
      />
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 },
  titulo: { fontSize: 22, fontFamily: FUENTE_DISPLAY.negrita },
  descripcion: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  grupo: { gap: 8 },
  etiquetaGrupo: { fontSize: 13, fontFamily: FUENTES.medio },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
