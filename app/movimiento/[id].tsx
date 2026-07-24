import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { ModalConfirmacion } from '@/src/componentes/comunes/ModalConfirmacion';
import { SelectorComprobante } from '@/src/componentes/comunes/SelectorComprobante';
import { SelectorFecha } from '@/src/componentes/comunes/SelectorFecha';
import { SIMBOLOS_MONEDA } from '@/src/constantes/finanzas';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { notificarSiExcedePresupuesto } from '@/src/servicios/notificaciones/alertasPresupuesto';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';

export default function PantallaDetalleMovimiento() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { movimientos, cuentas, categoriasPorTipo, actualizarMovimiento, eliminarMovimiento } = useFinanzas();
  const { presupuestos } = usePlanificacion();

  const movimiento = movimientos.find((m) => m.id === id);
  const cuenta = cuentas.find((c) => c.id === movimiento?.cuentaId);
  const cuentaDestino = cuentas.find((c) => c.id === movimiento?.cuentaDestinoId);

  const [editando, setEditando] = useState(false);
  const [monto, setMonto] = useState(movimiento ? String(movimiento.monto) : '');
  const [descripcion, setDescripcion] = useState(movimiento?.descripcion ?? '');
  const [nota, setNota] = useState(movimiento?.notas ?? '');
  const [comprobanteUrl, setComprobanteUrl] = useState(movimiento?.comprobanteUrl ?? null);
  const [categoriaId, setCategoriaId] = useState(movimiento?.categoriaId ?? undefined);
  const [fecha, setFecha] = useState<Date | null>(movimiento ? new Date(movimiento.fechaMovimiento) : new Date());
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const categoriasDisponibles = useMemo(
    () =>
      movimiento && (movimiento.tipo === 'ingreso' || movimiento.tipo === 'gasto')
        ? categoriasPorTipo(movimiento.tipo)
        : [],
    [movimiento, categoriasPorTipo]
  );
  const categoriaActual = categoriasDisponibles.find((c) => c.id === movimiento?.categoriaId);
  const tituloMovimiento =
    movimiento?.descripcion?.trim() ||
    (categoriaActual ? nombreCategoria(categoriaActual, t) : movimiento ? t(`pantallas.movimientoNuevo.${movimiento.tipo}`) : '');

  if (!movimiento) {
    return (
      <LayoutResponsive>
        <View style={estilos.encabezado}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('pantallas.movimientos.titulo')}</Text>
          <Pressable onPress={() => volverOIrA(router, '/(principal)/movimientos')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
            <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
          </Pressable>
        </View>
        <EstadoVacio titulo={t('pantallas.movimientos.sinMovimientos')} icono="receipt-long" />
      </LayoutResponsive>
    );
  }

  const puedeEditar = movimiento.tipo !== 'transferencia';

  const guardarCambios = async () => {
    const montoNumerico = Number.parseFloat(monto);
    if (!montoNumerico || montoNumerico <= 0) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGuardando(true);
    try {
      await actualizarMovimiento(movimiento.id, {
        monto: montoNumerico,
        descripcion: descripcion.trim() || null,
        notas: nota.trim() || null,
        categoriaId: categoriaId ?? null,
        fechaMovimiento: (fecha ?? new Date()).toISOString(),
        comprobanteUrl,
      });
      if (movimiento.tipo === 'gasto' && categoriaId) {
        const categoria = categoriasDisponibles.find((c) => c.id === categoriaId);
        const movimientosActualizados = movimientos.map((m) =>
          m.id === movimiento.id ? { ...m, monto: montoNumerico, categoriaId: categoriaId ?? null } : m
        );
        await notificarSiExcedePresupuesto(
          presupuestos,
          movimientosActualizados,
          categoriaId,
          categoria ? nombreCategoria(categoria, t) : '',
          t
        );
      }
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    await eliminarMovimiento(movimiento.id);
    volverOIrA(router, '/(principal)/movimientos');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <View style={estilos.encabezado}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
            {tituloMovimiento}
          </Text>
          <Pressable onPress={() => volverOIrA(router, '/(principal)/movimientos')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
            <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
          </Pressable>
        </View>

        {editando ? (
          <>
            <CampoMoneda
              etiqueta={t('pantallas.movimientoNuevo.monto')}
              valor={monto}
              onCambiarValor={setMonto}
              simboloMoneda={cuenta ? SIMBOLOS_MONEDA[cuenta.moneda] : 'Q'}
            />
            {categoriasDisponibles.length > 0 ? (
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
            ) : null}
            <CampoTexto etiqueta={t('pantallas.movimientoNuevo.descripcion')} value={descripcion} onChangeText={setDescripcion} />
            <SelectorFecha etiqueta={t('pantallas.movimientoNuevo.fecha')} valor={fecha} onCambiar={setFecha} />
            <SelectorComprobante uri={comprobanteUrl} onCambiar={setComprobanteUrl} />
            <CampoTexto etiqueta={t('pantallas.movimientoNuevo.nota')} value={nota} onChangeText={setNota} multiline />
            <View style={estilos.filaBotones}>
              <BotonSecundario titulo={t('comun.cancelar')} onPress={() => setEditando(false)} />
              <BotonPrincipal titulo={t('comun.guardar')} onPress={guardarCambios} cargando={guardando} />
            </View>
          </>
        ) : (
          <>
            <View style={[estilos.tarjetaDetalle, { borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta, borderRadius: tema.radios.tarjeta }]}>
              <FilaDetalle etiqueta={t('pantallas.movimientoNuevo.tipo')} valor={t(`pantallas.movimientoNuevo.${movimiento.tipo}`)} />
              <FilaDetalle etiqueta={t('pantallas.movimientoNuevo.monto')} valor={`${SIMBOLOS_MONEDA[cuenta?.moneda ?? 'GTQ']} ${movimiento.monto.toFixed(2)}`} />
              <FilaDetalle etiqueta={t('pantallas.movimientoNuevo.cuenta')} valor={cuenta?.nombre ?? '—'} />
              {cuentaDestino ? <FilaDetalle etiqueta="→" valor={cuentaDestino.nombre} /> : null}
              <FilaDetalle etiqueta={t('pantallas.movimientoNuevo.fecha')} valor={new Date(movimiento.fechaMovimiento).toLocaleDateString()} />
              {movimiento.notas ? <FilaDetalle etiqueta={t('pantallas.movimientoNuevo.nota')} valor={movimiento.notas} /> : null}
            </View>

            {movimiento.comprobanteUrl ? (
              <Image
                source={{ uri: movimiento.comprobanteUrl }}
                style={[estilos.comprobante, { borderRadius: tema.radios.tarjeta, borderColor: tema.colores.borde }]}
              />
            ) : null}

            <View style={estilos.filaBotones}>
              {puedeEditar ? <BotonSecundario titulo={t('comun.editar')} onPress={() => setEditando(true)} /> : null}
              <BotonPrincipal titulo={t('comun.eliminar')} onPress={() => setMostrarConfirmacion(true)} />
            </View>
          </>
        )}
      </View>

      <ModalConfirmacion
        visible={mostrarConfirmacion}
        titulo={t('comun.eliminar')}
        descripcion={t('comun.confirmar')}
        textoConfirmar={t('comun.eliminar')}
        textoCancelar={t('comun.cancelar')}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setMostrarConfirmacion(false)}
      />
    </LayoutResponsive>
  );
}

function FilaDetalle({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const { tema } = useTema();
  return (
    <View style={estilos.filaDetalle}>
      <Text style={{ color: tema.colores.textoSecundario, fontSize: 13 }}>{etiqueta}</Text>
      <Text style={{ color: tema.colores.textoPrincipal, fontSize: 13, fontWeight: '600' }}>{valor}</Text>
    </View>
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
  },
  titulo: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
  },
  tarjetaDetalle: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  filaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  comprobante: {
    width: '100%',
    height: 220,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
});
