import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { Cargador } from '@/src/componentes/comunes/Cargador';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { ModalConfirmacion } from '@/src/componentes/comunes/ModalConfirmacion';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useTema } from '@/src/contextos/ContextoTema';
import { crearCategoriaAPI, eliminarCategoriaAPI, listarCategoriasAPI } from '@/src/servicios/laravelApi/categorias';
import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import type { CategoriaAPI, TipoCategoriaAPI } from '@/src/tipos/laravelApi';

export default function PantallaCategoriasAPI() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();

  const [categorias, setCategorias] = useState<CategoriaAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoCategoriaAPI>('gasto');
  const [nombre, setNombre] = useState('');
  const [icono, setIcono] = useState('category');
  const [color, setColor] = useState('#7C4DFF');
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setCategorias(await listarCategoriasAPI());
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPILaravel ? fallo.codigo : 'respuesta';
      setError(t(`capacitaciones.errores.${codigo}`));
    } finally {
      setCargando(false);
    }
  }, [t]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const registrar = async () => {
    if (!nombre.trim() || !icono.trim() || !color.trim()) {
      setErrorFormulario(t('validaciones.campoRequerido'));
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorFormulario(undefined);
    setEnviando(true);
    try {
      await crearCategoriaAPI({ tipo, nombre: nombre.trim(), icono: icono.trim(), color: color.trim() });
      setNombre('');
      await cargar();
    } catch (fallo) {
      const codigo = fallo instanceof ErrorAPILaravel ? fallo.codigo : 'respuesta';
      setErrorFormulario(t(`capacitaciones.errores.${codigo}`));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (idAEliminar === null) return;
    const id = idAEliminar;
    setIdAEliminar(null);
    await eliminarCategoriaAPI(id);
    setCategorias((actual) => actual.filter((categoria) => categoria.id !== id));
  };

  return (
    <LayoutResponsive anchoMaximo={820}>
      <View style={estilos.encabezado}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.categorias.titulo')}
        </Text>
        <Pressable
          onPress={() => volverOIrA(router, '/(principal)/capacitaciones')}
          accessibilityRole="button"
          accessibilityLabel={t('comun.cerrar')}
          hitSlop={12}
        >
          <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
        </Pressable>
      </View>
      <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
        {t('capacitaciones.categorias.descripcion')}
      </Text>

      <TarjetaCristal estilo={estilos.formulario}>
        <Text style={[estilos.subtitulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.categorias.nuevoTitulo')}
        </Text>

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('capacitaciones.categorias.tipo')}
          </Text>
          <View style={estilos.filaChips}>
            <ChipCategoria
              etiqueta={t('capacitaciones.categorias.gasto')}
              seleccionado={tipo === 'gasto'}
              onPress={() => setTipo('gasto')}
            />
            <ChipCategoria
              etiqueta={t('capacitaciones.categorias.ingreso')}
              seleccionado={tipo === 'ingreso'}
              onPress={() => setTipo('ingreso')}
            />
          </View>
        </View>

        <CampoTexto etiqueta={t('capacitaciones.categorias.nombre')} value={nombre} onChangeText={setNombre} />
        <CampoTexto etiqueta={t('capacitaciones.categorias.icono')} value={icono} onChangeText={setIcono} />
        <CampoTexto etiqueta={t('capacitaciones.categorias.color')} value={color} onChangeText={setColor} />

        {errorFormulario ? <MensajeError mensaje={errorFormulario} /> : null}

        <BotonPrincipal titulo={t('capacitaciones.categorias.crear')} onPress={registrar} cargando={enviando} />
      </TarjetaCristal>

      {cargando ? <Cargador etiqueta={t('capacitaciones.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {!cargando && !error && categorias.length === 0 ? (
        <EstadoVacio icono="category" titulo={t('capacitaciones.categorias.sinDatos')} />
      ) : null}

      {categorias.map((categoria) => (
        <TarjetaCristal key={categoria.id} estilo={estilos.fila}>
          <Icono nombre={categoria.icono as NombreIcono} tamano={18} color={categoria.color} />
          <View style={estilos.info}>
            <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {categoria.nombre}
            </Text>
            <Text style={[estilos.meta, { color: tema.colores.textoSecundario }]}>
              {categoria.tipo === 'gasto' ? t('capacitaciones.categorias.gasto') : t('capacitaciones.categorias.ingreso')}
            </Text>
          </View>
          <Pressable
            onPress={() => setIdAEliminar(categoria.id)}
            accessibilityRole="button"
            accessibilityLabel={t('comun.eliminar')}
            hitSlop={10}
          >
            <Icono nombre="delete-outline" tamano={20} color={tema.colores.gasto} />
          </Pressable>
        </TarjetaCristal>
      ))}

      <ModalConfirmacion
        visible={idAEliminar !== null}
        titulo={t('comun.eliminar')}
        textoConfirmar={t('comun.eliminar')}
        textoCancelar={t('comun.cancelar')}
        destructivo
        onConfirmar={confirmarEliminar}
        onCancelar={() => setIdAEliminar(null)}
      />
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 },
  titulo: { fontSize: 22, fontFamily: FUENTE_DISPLAY.negrita },
  descripcion: { fontSize: 14, lineHeight: 20 },
  formulario: { gap: 14 },
  subtitulo: { fontSize: 16, fontFamily: FUENTES.seminegrita },
  grupo: { gap: 8 },
  etiquetaGrupo: { fontSize: 13, fontFamily: FUENTES.medio },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1, gap: 2 },
  nombre: { fontSize: 15, fontFamily: FUENTES.seminegrita },
  meta: { fontSize: 12 },
});
