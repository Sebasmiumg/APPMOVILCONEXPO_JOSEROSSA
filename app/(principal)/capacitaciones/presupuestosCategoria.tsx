import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { Cargador } from '@/src/componentes/comunes/Cargador';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { ModalConfirmacion } from '@/src/componentes/comunes/ModalConfirmacion';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useTema } from '@/src/contextos/ContextoTema';
import { listarCategoriasAPI } from '@/src/servicios/laravelApi/categorias';
import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import {
  crearPresupuestoCategoriaAPI,
  eliminarPresupuestoCategoriaAPI,
  listarPresupuestosCategoriaAPI,
} from '@/src/servicios/laravelApi/presupuestosCategoria';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import type { CategoriaAPI, PresupuestoCategoriaAPI } from '@/src/tipos/laravelApi';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

const PORCENTAJES_ALERTA = [50, 75, 80, 90, 100];

function periodoActualISO(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
}

export default function PantallaPresupuestosCategoriaAPI() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();

  const [presupuestos, setPresupuestos] = useState<PresupuestoCategoriaAPI[]>([]);
  const [categorias, setCategorias] = useState<CategoriaAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoriaId, setCategoriaId] = useState<string | undefined>();
  const [periodo, setPeriodo] = useState(periodoActualISO());
  const [limite, setLimite] = useState('');
  const [porcentajeAlerta, setPorcentajeAlerta] = useState(80);
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosPresupuestos, datosCategorias] = await Promise.all([
        listarPresupuestosCategoriaAPI(),
        listarCategoriasAPI(),
      ]);
      setPresupuestos(datosPresupuestos);
      const categoriasGasto = datosCategorias.filter((categoria) => categoria.tipo === 'gasto');
      setCategorias(categoriasGasto);
      setCategoriaId((actual) => actual ?? categoriasGasto[0]?.id);
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

  const dinero = (monto: number) => formatearMoneda(monto, 'GTQ', idioma);
  const nombreCategoria = (id: string) => categorias.find((categoria) => categoria.id === id)?.nombre ?? `#${id}`;

  const registrar = async () => {
    const montoLimite = Number.parseFloat(limite);
    if (!categoriaId) {
      setErrorFormulario(t('validaciones.campoRequerido'));
      return;
    }
    if (!montoLimite || montoLimite <= 0) {
      setErrorFormulario(t('validaciones.montoInvalido'));
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorFormulario(undefined);
    setEnviando(true);
    try {
      await crearPresupuestoCategoriaAPI({
        categoria_id: categoriaId,
        periodo,
        limite: montoLimite,
        porcentaje_alerta: porcentajeAlerta,
      });
      setLimite('');
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
    await eliminarPresupuestoCategoriaAPI(id);
    setPresupuestos((actual) => actual.filter((presupuesto) => presupuesto.id !== id));
  };

  return (
    <LayoutResponsive anchoMaximo={820}>
      <View style={estilos.encabezado}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.presupuestosCategoria.titulo')}
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
        {t('capacitaciones.presupuestosCategoria.descripcion')}
      </Text>

      <TarjetaCristal estilo={estilos.formulario}>
        <Text style={[estilos.subtitulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.presupuestosCategoria.nuevoTitulo')}
        </Text>

        {categorias.length === 0 ? (
          <MensajeError mensaje={t('capacitaciones.categorias.sinDatos')} />
        ) : (
          <View style={estilos.grupo}>
            <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
              {t('capacitaciones.presupuestosCategoria.categoria')}
            </Text>
            <View style={estilos.filaChips}>
              {categorias.map((categoria) => (
                <ChipCategoria
                  key={categoria.id}
                  etiqueta={categoria.nombre}
                  seleccionado={categoriaId === categoria.id}
                  onPress={() => setCategoriaId(categoria.id)}
                />
              ))}
            </View>
          </View>
        )}

        <CampoTexto
          etiqueta={t('capacitaciones.presupuestosCategoria.periodo')}
          value={periodo}
          onChangeText={setPeriodo}
          placeholder="2026-09"
        />

        <CampoMoneda etiqueta={t('capacitaciones.presupuestosCategoria.limite')} valor={limite} onCambiarValor={setLimite} />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('capacitaciones.presupuestosCategoria.porcentajeAlerta')}
          </Text>
          <View style={estilos.filaChips}>
            {PORCENTAJES_ALERTA.map((valor) => (
              <ChipCategoria
                key={valor}
                etiqueta={`${valor}%`}
                seleccionado={porcentajeAlerta === valor}
                onPress={() => setPorcentajeAlerta(valor)}
              />
            ))}
          </View>
        </View>

        {errorFormulario ? <MensajeError mensaje={errorFormulario} /> : null}

        <BotonPrincipal
          titulo={t('capacitaciones.presupuestosCategoria.crear')}
          onPress={registrar}
          cargando={enviando}
          deshabilitado={categorias.length === 0}
        />
      </TarjetaCristal>

      {cargando ? <Cargador etiqueta={t('capacitaciones.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {!cargando && !error && presupuestos.length === 0 ? (
        <EstadoVacio icono="pie-chart" titulo={t('capacitaciones.presupuestosCategoria.sinDatos')} />
      ) : null}

      {presupuestos.map((presupuesto) => (
        <TarjetaCristal key={presupuesto.id} estilo={estilos.fila}>
          <View style={estilos.info}>
            <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {nombreCategoria(presupuesto.categoria_id)}
            </Text>
            <Text style={[estilos.meta, { color: tema.colores.textoSecundario }]}>
              {presupuesto.periodo} · {dinero(Number(presupuesto.limite))} · {presupuesto.porcentaje_alerta}%
            </Text>
          </View>
          <Pressable
            onPress={() => setIdAEliminar(presupuesto.id)}
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
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  info: { flex: 1, gap: 2 },
  nombre: { fontSize: 15, fontFamily: FUENTES.seminegrita },
  meta: { fontSize: 12 },
});
