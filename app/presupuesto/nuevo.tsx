import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { SIMBOLOS_MONEDA } from '@/src/constantes/finanzas';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

const PORCENTAJES_ALERTA = [50, 75, 80, 90, 100];

function periodoActualISO(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
}

export default function PantallaNuevoPresupuesto() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { categoriasPorTipo, cuentas } = useFinanzas();
  const { presupuestos, crearPresupuesto } = usePlanificacion();

  const categoriasGasto = categoriasPorTipo('gasto');
  const simboloMoneda = SIMBOLOS_MONEDA[cuentas[0]?.moneda ?? 'GTQ'];
  const periodo = periodoActualISO();
  const categoriasDisponibles = categoriasGasto.filter(
    (categoria) => !presupuestos.some((p) => p.categoriaId === categoria.id && p.periodo === periodo)
  );

  const [categoriaId, setCategoriaId] = useState<string | undefined>(categoriasDisponibles[0]?.id);
  const [limite, setLimite] = useState('');
  const [porcentajeAlerta, setPorcentajeAlerta] = useState(80);
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    const limiteNumerico = Number.parseFloat(limite);
    if (!categoriaId) {
      setError(t('validaciones.campoRequerido'));
      return;
    }
    if (!limiteNumerico || limiteNumerico <= 0) {
      setError(t('validaciones.montoInvalido'));
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(undefined);
    setEnviando(true);
    try {
      await crearPresupuesto({ categoriaId, periodo, limite: limiteNumerico, porcentajeAlerta });
      volverOIrA(router, '/(principal)/analisis');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Animated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
          <BlurView
                    intensity={30}
                    tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
                    style={estilos.encabezado}
                  >
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('presupuestos.titulo')}</Text>
                    <Pressable onPress={() => volverOIrA(router, '/(principal)/analisis')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
                      <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
                    </Pressable>
                  </BlurView>
        </Animated.View>

        {categoriasDisponibles.length === 0 ? (
          <MensajeError mensaje={t('pantallas.analisis.sinPresupuestos')} />
        ) : (
          <>
            <View style={estilos.grupo}>
              <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
                {t('presupuestos.categoria')}
              </Text>
              <View style={estilos.filaChips}>
                {categoriasDisponibles.map((categoria) => (
                  <ChipCategoria
                    key={categoria.id}
                    etiqueta={nombreCategoria(categoria, t)}
                    icono={categoria.icono as NombreIcono}
                    color={categoria.color}
                    seleccionado={categoriaId === categoria.id}
                    onPress={() => setCategoriaId(categoria.id)}
                  />
                ))}
              </View>
            </View>

            <CampoMoneda etiqueta={t('presupuestos.limite')} valor={limite} onCambiarValor={setLimite} simboloMoneda={simboloMoneda} />

            <View style={estilos.grupo}>
              <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
                {t('presupuestos.alertaPorcentual')}
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

            {error ? <MensajeError mensaje={error} /> : null}

            <BotonPrincipal titulo={t('presupuestos.crear')} onPress={guardar} cargando={enviando} />
          </>
        )}
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 20,
    fontFamily: FUENTE_DISPLAY.negrita,
  },
  grupo: {
    gap: 8,
  },
  etiquetaGrupo: {
    fontSize: 13,
    fontFamily: FUENTES.medio,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
