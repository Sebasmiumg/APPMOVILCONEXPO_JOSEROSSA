import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES, FUENTE_DISPLAY } from '@/src/temas/tipografia';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { SelectorComprobante } from '@/src/componentes/comunes/SelectorComprobante';
import { SelectorFecha } from '@/src/componentes/comunes/SelectorFecha';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { ICONOS_TIPO_CUENTA, SIMBOLOS_MONEDA } from '@/src/constantes/finanzas';
import { notificarSiExcedePresupuesto } from '@/src/servicios/notificaciones/alertasPresupuesto';
import type { TipoCategoria } from '@/src/tipos/categoria';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

type TipoMovimientoFormulario = 'ingreso' | 'gasto' | 'transferencia' | 'ajuste';

const TIPOS: TipoMovimientoFormulario[] = ['ingreso', 'gasto', 'transferencia', 'ajuste'];

export default function PantallaNuevoMovimiento() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { cuentaId: cuentaIdInicial } = useLocalSearchParams<{ cuentaId?: string }>();
  const { cuentas, movimientos, categoriasPorTipo, crearMovimiento, crearTransferencia, crearCategoriaPersonalizada } = useFinanzas();
  const { presupuestos } = usePlanificacion();

  const [tipo, setTipo] = useState<TipoMovimientoFormulario>('gasto');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nota, setNota] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [cuentaId, setCuentaId] = useState<string | undefined>(cuentaIdInicial);
  const [cuentaDestinoId, setCuentaDestinoId] = useState<string | undefined>();
  const [categoriaId, setCategoriaId] = useState<string | undefined>();
  const [nombreCategoriaNueva, setNombreCategoriaNueva] = useState('');
  const [mostrarFormularioCategoria, setMostrarFormularioCategoria] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const cuentaIdEfectivo = cuentaId ?? cuentas[0]?.id;
  const cuentaSeleccionada = cuentas.find((c) => c.id === cuentaIdEfectivo);
  const categoriaTipo: TipoCategoria | null = tipo === 'ingreso' || tipo === 'gasto' ? tipo : null;
  const categoriasDisponibles = useMemo(
    () => (categoriaTipo ? categoriasPorTipo(categoriaTipo) : []),
    [categoriaTipo, categoriasPorTipo]
  );

  if (cuentas.length === 0) {
    return (
      <LayoutResponsive>
        <EstadoVacio
          titulo={t('configuracionInicial.finanzas.titulo')}
          descripcion={t('comun.proximamente')}
          icono="account-balance-wallet"
        />
      </LayoutResponsive>
    );
  }

  const guardar = async () => {
    setError(undefined);
    const montoNumerico = Number.parseFloat(monto);
    if (!cuentaSeleccionada) {
      setError(t('validaciones.campoRequerido'));
      return;
    }
    if (!montoNumerico || montoNumerico <= 0) {
      setError(t('validaciones.montoInvalido'));
      return;
    }
    if (tipo === 'transferencia' && (!cuentaDestinoId || cuentaDestinoId === cuentaSeleccionada.id)) {
      setError(t('validaciones.campoRequerido'));
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnviando(true);
    try {
      const fechaISO = (fecha ?? new Date()).toISOString();
      if (tipo === 'transferencia') {
        await crearTransferencia({
          cuentaOrigenId: cuentaSeleccionada.id,
          cuentaDestinoId: cuentaDestinoId!,
          monto: montoNumerico,
          descripcion: descripcion.trim() || null,
          notas: nota.trim() || null,
          fechaMovimiento: fechaISO,
        });
      } else {
        const nuevoMovimiento = await crearMovimiento({
          cuentaId: cuentaSeleccionada.id,
          tipo,
          monto: montoNumerico,
          categoriaId: categoriaId ?? null,
          descripcion: descripcion.trim() || null,
          notas: nota.trim() || null,
          fechaMovimiento: fechaISO,
          comprobanteUrl,
          recurrente: esRecurrente,
        });
        if (tipo === 'gasto' && categoriaId) {
          const categoria = categoriasDisponibles.find((c) => c.id === categoriaId);
          await notificarSiExcedePresupuesto(
            presupuestos,
            [...movimientos, nuevoMovimiento],
            categoriaId,
            categoria ? nombreCategoria(categoria, t) : '',
            t
          );
        }
      }
      volverOIrA(router, '/(principal)/inicio');
    } finally {
      setEnviando(false);
    }
  };

  const agregarCategoriaPersonalizada = async () => {
    if (!nombreCategoriaNueva.trim() || !categoriaTipo) return;
    const categoria = await crearCategoriaPersonalizada(categoriaTipo, nombreCategoriaNueva.trim());
    setCategoriaId(categoria.id);
    setNombreCategoriaNueva('');
    setMostrarFormularioCategoria(false);
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
                    <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
                      {t('pantallas.movimientoNuevo.titulo')}
                    </Text>
                    <Pressable onPress={() => volverOIrA(router, '/(principal)/inicio')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
                      <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
                    </Pressable>
                  </BlurView>
        </Animated.View>

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.movimientoNuevo.tipo')}
          </Text>
          <View style={estilos.filaChips}>
            {TIPOS.map((valor) => (
              <ChipCategoria
                key={valor}
                etiqueta={t(`pantallas.movimientoNuevo.${valor}`)}
                seleccionado={tipo === valor}
                onPress={() => {
                  setTipo(valor);
                  setCategoriaId(undefined);
                }}
                color={valor === 'ingreso' ? tema.colores.ingreso : valor === 'gasto' ? tema.colores.gasto : undefined}
              />
            ))}
          </View>
        </View>

        <CampoMoneda
          etiqueta={t('pantallas.movimientoNuevo.monto')}
          valor={monto}
          onCambiarValor={setMonto}
          simboloMoneda={cuentaSeleccionada ? SIMBOLOS_MONEDA[cuentaSeleccionada.moneda] : 'Q'}
        />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {tipo === 'transferencia' ? `${t('pantallas.movimientoNuevo.cuenta')} (${t('pantallas.movimientoNuevo.transferencia')})` : t('pantallas.movimientoNuevo.cuenta')}
          </Text>
          <View style={estilos.filaChips}>
            {cuentas.map((cuenta) => (
              <ChipCategoria
                key={cuenta.id}
                etiqueta={cuenta.nombre}
                icono={ICONOS_TIPO_CUENTA[cuenta.tipo]}
                seleccionado={cuentaIdEfectivo === cuenta.id}
                onPress={() => setCuentaId(cuenta.id)}
              />
            ))}
          </View>
        </View>

        {tipo === 'transferencia' ? (
          <View style={estilos.grupo}>
            <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
              {t('pantallas.movimientoNuevo.cuenta')} →
            </Text>
            <View style={estilos.filaChips}>
              {cuentas
                .filter((cuenta) => cuenta.id !== cuentaSeleccionada?.id)
                .map((cuenta) => (
                  <ChipCategoria
                    key={cuenta.id}
                    etiqueta={cuenta.nombre}
                    icono={ICONOS_TIPO_CUENTA[cuenta.tipo]}
                    seleccionado={cuentaDestinoId === cuenta.id}
                    onPress={() => setCuentaDestinoId(cuenta.id)}
                  />
                ))}
            </View>
          </View>
        ) : null}

        {categoriaTipo ? (
          <View style={estilos.grupo}>
            <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
              {t('pantallas.movimientoNuevo.categoria')}
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
              <ChipCategoria
                etiqueta={t('categorias.crearCategoria')}
                icono="add"
                onPress={() => setMostrarFormularioCategoria((valor) => !valor)}
              />
            </View>
            {mostrarFormularioCategoria ? (
              <View style={estilos.filaCategoriaPersonalizada}>
                <View style={estilos.campoCategoriaPersonalizada}>
                  <CampoTexto
                    etiqueta={t('categorias.nombreCategoria')}
                    value={nombreCategoriaNueva}
                    onChangeText={setNombreCategoriaNueva}
                  />
                </View>
                <Pressable
                  onPress={agregarCategoriaPersonalizada}
                  style={[estilos.botonAgregarCategoria, { backgroundColor: tema.colores.violeta }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('categorias.confirmarCategoria')}
                >
                  <Icono nombre="check" tamano={18} color={tema.colores.sobrePrimario} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <CampoTexto
          etiqueta={t('pantallas.movimientoNuevo.descripcion')}
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <SelectorFecha etiqueta={t('pantallas.movimientoNuevo.fecha')} valor={fecha} onCambiar={setFecha} />

        {categoriaTipo ? (
          <View style={estilos.filaChips}>
            <ChipCategoria
              etiqueta={t('pantallas.movimientoNuevo.esRecurrente')}
              icono="event-repeat"
              seleccionado={esRecurrente}
              onPress={() => setEsRecurrente((valor) => !valor)}
            />
          </View>
        ) : null}

        {tipo !== 'transferencia' ? (
          <SelectorComprobante uri={comprobanteUrl} onCambiar={setComprobanteUrl} />
        ) : null}

        <CampoTexto
          etiqueta={`${t('pantallas.movimientoNuevo.nota')} (${t('comun.opcional')})`}
          value={nota}
          onChangeText={setNota}
          multiline
        />

        {error ? <MensajeError mensaje={error} /> : null}

        <BotonPrincipal titulo={t('pantallas.movimientoNuevo.guardarMovimiento')} onPress={guardar} cargando={enviando} />
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
  filaCategoriaPersonalizada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  campoCategoriaPersonalizada: {
    flex: 1,
  },
  botonAgregarCategoria: {
    width: 44,
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
