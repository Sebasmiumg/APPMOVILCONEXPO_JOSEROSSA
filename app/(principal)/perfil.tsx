import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { borrarDatosLocalesDemo, obtenerPerfilDemo } from '@/src/almacenamiento/perfilDemo';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { ModalConfirmacion } from '@/src/componentes/comunes/ModalConfirmacion';
import { SelectorIdioma } from '@/src/componentes/comunes/SelectorIdioma';
import { SelectorTema } from '@/src/componentes/comunes/SelectorTema';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { TarjetaTipoCorreo } from '@/src/componentes/autenticacion/TarjetaTipoCorreo';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useSesion } from '@/src/contextos/ContextoSesion';
import { useTema } from '@/src/contextos/ContextoTema';
import { exportarDatosUsuario } from '@/src/servicios/exportacion/exportarDatosUsuario';
import { permisoNotificacionesConcedido, solicitarPermisoNotificaciones } from '@/src/servicios/notificaciones/alertasPresupuesto';
import {
  autenticarConBiometria,
  bloqueoBiometricoActivado,
  bloqueoBiometricoDisponible,
  establecerBloqueoBiometrico,
} from '@/src/servicios/seguridad/bloqueoBiometrico';
import { cerrarSesionSupabase } from '@/src/servicios/supabase/autenticacion';
import { supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import { eliminarDatosUsuarioEnNube } from '@/src/servicios/supabase/eliminarDatos';
import { contarPendientes, sincronizarCambiosPendientes } from '@/src/servicios/sincronizacion/sincronizador';
import { clasificarCorreo } from '@/src/utilidades/clasificarCorreo';

export default function PantallaPerfil() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma, establecerIdioma } = useIdioma();
  const { modo, establecerModo } = useTema();
  const router = useRouter();

  const db = useSQLiteContext();
  const { configurado: supabaseConfigurado, sesion, usuario } = useSesion();
  const { cuentas, categorias, movimientos } = useFinanzas();
  const { presupuestos, metas, obtenerAportesMeta } = usePlanificacion();
  const [nombre, setNombre] = useState<string | null>(null);
  const [correo, setCorreo] = useState<string | null>(null);
  const [modalActivo, setModalActivo] = useState<'cerrarSesion' | 'eliminarCuenta' | null>(null);
  const [pendientesSincronizacion, setPendientesSincronizacion] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [bloqueoDisponible, setBloqueoDisponible] = useState(false);
  const [bloqueoActivo, setBloqueoActivo] = useState(false);
  const [notificacionesConcedidas, setNotificacionesConcedidas] = useState(false);

  useFocusEffect(
    useCallback(() => {
      obtenerPerfilDemo().then((perfil) => {
        setNombre(perfil.nombre);
        setCorreo(perfil.correo);
      });
      contarPendientes(db).then(setPendientesSincronizacion);
      bloqueoBiometricoDisponible().then(setBloqueoDisponible);
      bloqueoBiometricoActivado().then(setBloqueoActivo);
      permisoNotificacionesConcedido().then(setNotificacionesConcedidas);
    }, [db])
  );

  const alternarBloqueoBiometrico = async () => {
    if (bloqueoActivo) {
      await establecerBloqueoBiometrico(false);
      setBloqueoActivo(false);
      return;
    }
    const confirmado = await autenticarConBiometria(t('seguridad.confirmarParaActivar'));
    if (confirmado) {
      await establecerBloqueoBiometrico(true);
      setBloqueoActivo(true);
    }
  };

  const activarNotificaciones = async () => {
    const concedido = await solicitarPermisoNotificaciones();
    setNotificacionesConcedidas(concedido);
  };

  const clasificacion = useMemo(() => (correo ? clasificarCorreo(correo) : null), [correo]);

  const sincronizarAhora = async () => {
    if (!usuario) return;
    setSincronizando(true);
    await sincronizarCambiosPendientes(db, usuario.id);
    setPendientesSincronizacion(await contarPendientes(db));
    setSincronizando(false);
  };

  const exportarDatos = async () => {
    setExportando(true);
    try {
      await exportarDatosUsuario({ cuentas, categorias, movimientos, presupuestos, metas, obtenerAportesMeta });
    } finally {
      setExportando(false);
    }
  };

  const confirmarAccionDestructiva = async () => {
    if (supabaseConfigurado && sesion && usuario) {
      if (modalActivo === 'eliminarCuenta') {
        await eliminarDatosUsuarioEnNube(usuario.id);
      }
      await cerrarSesionSupabase();
    }
    await borrarDatosLocalesDemo();
    setModalActivo(null);
    router.replace('/bienvenida');
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('pantallas.perfil.titulo')}</Text>

        <TarjetaCristal estilo={estilos.tarjetaIdentidad}>
          <View style={[estilos.avatar, { backgroundColor: tema.colores.violeta }]}>
            <Text style={estilos.avatarInicial}>{(nombre ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={estilos.identidadTextos}>
            <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]}>{nombre ?? '—'}</Text>
            <Text style={[estilos.correo, { color: tema.colores.textoSecundario }]}>{correo ?? '—'}</Text>
          </View>
        </TarjetaCristal>

        {clasificacion ? <TarjetaTipoCorreo {...clasificacion} /> : null}

        <View style={estilos.seccion}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.perfil.idioma')}
          </Text>
          <SelectorIdioma idiomaSeleccionado={idioma} onSeleccionar={establecerIdioma} />
        </View>

        <View style={estilos.seccion}>
          <Text style={[estilos.tituloSeccion, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.perfil.tema')}
          </Text>
          <SelectorTema modoSeleccionado={modo} onSeleccionar={establecerModo} />
        </View>

        {cuentas.length > 0 ? (
          <TarjetaCristal>
            <View style={estilos.filaMoneda}>
              <Icono nombre="attach-money" tamano={18} color={tema.colores.textoSecundario} />
              <Text style={[estilos.textoMoneda, { color: tema.colores.textoPrincipal }]}>
                {t('pantallas.perfil.moneda')}: {cuentas[0].moneda}
              </Text>
            </View>
          </TarjetaCristal>
        ) : null}

        <TarjetaCristal>
          <View style={estilos.filaMoneda}>
            <Icono
              nombre={supabaseConfigurado ? 'cloud-done' : 'cloud-off'}
              tamano={18}
              color={supabaseConfigurado ? tema.colores.ingreso : tema.colores.textoSecundario}
            />
            <Text style={[estilos.textoMoneda, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.perfil.sincronizacion.titulo')}
            </Text>
          </View>
          <Text style={{ color: tema.colores.textoSecundario, fontSize: 13, marginTop: 6 }}>
            {!supabaseConfigurado
              ? t('pantallas.perfil.sincronizacion.sinConfigurar')
              : pendientesSincronizacion === 0
                ? t('pantallas.perfil.sincronizacion.alDia')
                : t('pantallas.perfil.sincronizacion.pendientes', { cantidad: pendientesSincronizacion })}
          </Text>
          {supabaseConfigurado && sesion && pendientesSincronizacion > 0 ? (
            <Pressable
              onPress={sincronizarAhora}
              disabled={sincronizando}
              style={{ marginTop: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('pantallas.perfil.sincronizacion.sincronizar')}
            >
              <Text style={{ color: tema.colores.violeta, fontWeight: '700', fontSize: 13 }}>
                {sincronizando ? t('pantallas.perfil.sincronizacion.sincronizando') : t('pantallas.perfil.sincronizacion.sincronizar')}
              </Text>
            </Pressable>
          ) : null}
        </TarjetaCristal>

        <TarjetaCristal>
          <View style={estilos.filaMoneda}>
            <Icono nombre="fingerprint" tamano={18} color={tema.colores.textoSecundario} />
            <Text style={[estilos.textoMoneda, { color: tema.colores.textoPrincipal }]}>
              {t('seguridad.bloqueoBiometrico')}
            </Text>
          </View>
          <Text style={{ color: tema.colores.textoSecundario, fontSize: 13, marginTop: 6 }}>
            {t('seguridad.bloqueoBiometricoDescripcion')}
          </Text>
          {bloqueoDisponible ? (
            <Pressable
              onPress={alternarBloqueoBiometrico}
              style={{ marginTop: 10 }}
              accessibilityRole="switch"
              accessibilityState={{ checked: bloqueoActivo }}
              accessibilityLabel={t('seguridad.bloqueoBiometrico')}
            >
              <Text style={{ color: tema.colores.violeta, fontWeight: '700', fontSize: 13 }}>
                {bloqueoActivo ? t('seguridad.activado') : t('seguridad.desactivado')}
              </Text>
            </Pressable>
          ) : (
            <Text style={{ color: tema.colores.textoSecundario, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
              {Platform.OS === 'web'
                ? t('seguridad.bloqueoBiometricoNoDisponibleWeb')
                : t('seguridad.bloqueoBiometricoNoDisponible')}
            </Text>
          )}
        </TarjetaCristal>

        <TarjetaCristal>
          <View style={estilos.filaMoneda}>
            <Icono nombre="notifications" tamano={18} color={tema.colores.textoSecundario} />
            <Text style={[estilos.textoMoneda, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.perfil.notificaciones')}
            </Text>
          </View>
          {Platform.OS === 'web' ? (
            <Text style={{ color: tema.colores.textoSecundario, fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
              {t('notificaciones.noDisponibleWeb')}
            </Text>
          ) : notificacionesConcedidas ? (
            <Text style={{ color: tema.colores.ingreso, fontSize: 13, marginTop: 6, fontWeight: '600' }}>
              {t('seguridad.activado')}
            </Text>
          ) : (
            <Pressable
              onPress={activarNotificaciones}
              style={{ marginTop: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('pantallas.perfil.notificaciones')}
            >
              <Text style={{ color: tema.colores.violeta, fontWeight: '700', fontSize: 13 }}>
                {t('seguridad.desactivado')}
              </Text>
            </Pressable>
          )}
        </TarjetaCristal>

        <View style={estilos.seccion}>
          <Pressable
            onPress={() => router.push('/cuenta')}
            style={[estilos.filaOpcion, { borderColor: tema.colores.borde }]}
            accessibilityRole="button"
            accessibilityLabel={t('pantallas.perfil.cuentas')}
          >
            <Icono nombre="account-balance-wallet" tamano={20} color={tema.colores.textoSecundario} />
            <Text style={[estilos.textoOpcion, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.perfil.cuentas')}
            </Text>
            <Icono nombre="chevron-right" tamano={18} color={tema.colores.textoSecundario} />
          </Pressable>

          <Pressable
            onPress={exportarDatos}
            disabled={exportando}
            style={[estilos.filaOpcion, { borderColor: tema.colores.borde }]}
            accessibilityRole="button"
            accessibilityLabel={t('pantallas.perfil.exportarDatos')}
          >
            <Icono nombre="file-download" tamano={20} color={tema.colores.textoSecundario} />
            <Text style={[estilos.textoOpcion, { color: tema.colores.textoPrincipal }]}>
              {exportando ? t('pantallas.reporte.generando') : t('pantallas.perfil.exportarDatos')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/privacidad')}
            style={[estilos.filaOpcion, { borderColor: tema.colores.borde }]}
            accessibilityRole="button"
            accessibilityLabel={t('pantallas.perfil.privacidad')}
          >
            <Icono nombre="lock" tamano={20} color={tema.colores.textoSecundario} />
            <Text style={[estilos.textoOpcion, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.perfil.privacidad')}
            </Text>
            <Icono nombre="chevron-right" tamano={18} color={tema.colores.textoSecundario} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setModalActivo('cerrarSesion')}
          style={[estilos.filaOpcion, { borderColor: tema.colores.borde }]}
          accessibilityRole="button"
          accessibilityLabel={t('pantallas.perfil.cerrarSesion')}
        >
          <Icono nombre="logout" tamano={20} color={tema.colores.textoPrincipal} />
          <Text style={[estilos.textoOpcion, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.perfil.cerrarSesion')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setModalActivo('eliminarCuenta')}
          style={[estilos.filaOpcion, { borderColor: tema.colores.gasto }]}
          accessibilityRole="button"
          accessibilityLabel={t('pantallas.perfil.eliminarCuenta')}
        >
          <Icono nombre="delete-forever" tamano={20} color={tema.colores.gasto} />
          <Text style={[estilos.textoOpcion, { color: tema.colores.gasto }]}>
            {t('pantallas.perfil.eliminarCuenta')}
          </Text>
        </Pressable>
      </View>

      <ModalConfirmacion
        visible={modalActivo !== null}
        titulo={t(`pantallas.perfil.${modalActivo === 'eliminarCuenta' ? 'eliminarCuenta' : 'cerrarSesion'}`)}
        descripcion={t(modalActivo === 'eliminarCuenta' ? 'pantallas.perfil.confirmarEliminarCuenta' : 'comun.confirmar')}
        textoConfirmar={t('comun.confirmar')}
        textoCancelar={t('comun.cancelar')}
        onConfirmar={confirmarAccionDestructiva}
        onCancelar={() => setModalActivo(null)}
      />
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  tarjetaIdentidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInicial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  identidadTextos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
  },
  correo: {
    fontSize: 13,
  },
  seccion: {
    gap: 10,
  },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: '600',
  },
  filaMoneda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoMoneda: {
    fontSize: 14,
    fontWeight: '600',
  },
  filaOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  textoOpcion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
