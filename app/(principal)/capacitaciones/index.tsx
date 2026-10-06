import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Cargador } from '@/src/componentes/comunes/Cargador';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { FilaMenu } from '@/src/componentes/comunes/FilaMenu';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { TarjetaMetrica } from '@/src/componentes/comunes/TarjetaMetrica';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { useSesionLaravel } from '@/src/contextos/ContextoSesionLaravel';
import { useTema } from '@/src/contextos/ContextoTema';
import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import { listarMovimientosAPI } from '@/src/servicios/laravelApi/movimientos';
import { obtenerReporteMovimientosPorMes } from '@/src/servicios/laravelApi/reportes';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import type { MovimientoAPI, ReporteMensualAPI } from '@/src/tipos/laravelApi';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

const LIMITE_MOVIMIENTOS_RECIENTES = 5;

export default function PantallaReporteCapacitaciones() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();
  const { usuario, cerrarSesion } = useSesionLaravel();

  const [reporte, setReporte] = useState<ReporteMensualAPI[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosReporte, datosMovimientos] = await Promise.all([
        obtenerReporteMovimientosPorMes(),
        listarMovimientosAPI(),
      ]);
      setReporte(datosReporte);
      setMovimientos(datosMovimientos.slice(0, LIMITE_MOVIMIENTOS_RECIENTES));
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

  return (
    <LayoutResponsive anchoMaximo={820}>
      <LinearGradient colors={['#123024', '#1F5C3F', '#4BB88A']} style={estilos.banner}>
        <Text style={estilos.insignia}>{t('capacitaciones.fuente')}</Text>
        <Text style={estilos.titulo}>{t('capacitaciones.reporte.titulo')}</Text>
        <Text style={estilos.subtitulo}>{t('capacitaciones.reporte.descripcion')}</Text>
        {usuario ? <Text style={estilos.subtitulo}>{usuario.email}</Text> : null}
      </LinearGradient>

      <View style={estilos.menu}>
        <Text style={[estilos.subtituloSeccion, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.menu.titulo')}
        </Text>
        <Text style={[estilos.descripcionMenu, { color: tema.colores.textoSecundario }]}>
          {t('capacitaciones.menu.descripcion')}
        </Text>
        <FilaMenu
          titulo={t('capacitaciones.menu.cuentas')}
          icono="account-balance-wallet"
          onPress={() => router.push('/capacitaciones/cuentas' as Href)}
        />
        <FilaMenu
          titulo={t('capacitaciones.menu.categorias')}
          icono="category"
          onPress={() => router.push('/capacitaciones/categorias' as Href)}
        />
        <FilaMenu
          titulo={t('capacitaciones.menu.metas')}
          icono="flag"
          onPress={() => router.push('/capacitaciones/metas' as Href)}
        />
        <FilaMenu
          titulo={t('capacitaciones.menu.presupuestosCategoria')}
          icono="pie-chart"
          onPress={() => router.push('/capacitaciones/presupuestosCategoria' as Href)}
        />
        <FilaMenu
          titulo={t('capacitaciones.menu.presupuestosCapacitacion')}
          icono="school"
          onPress={() => router.push('/capacitaciones/presupuestos' as Href)}
        />
        <FilaMenu titulo={t('capacitaciones.login.cerrarSesion')} icono="logout" onPress={cerrarSesion} />
      </View>

      {cargando ? <Cargador etiqueta={t('capacitaciones.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {!cargando && !error && reporte.length === 0 ? (
        <EstadoVacio icono="bar-chart" titulo={t('capacitaciones.reporte.sinDatos')} />
      ) : null}

      {reporte.map((mes) => (
        <TarjetaCristal key={mes.periodo} estilo={estilos.tarjetaMes}>
          <Text style={[estilos.periodo, { color: tema.colores.textoPrincipal }]}>{mes.periodo}</Text>
          <View style={estilos.filaMetricas}>
            <TarjetaMetrica
              etiqueta={t('capacitaciones.reporte.ingresos')}
              valor={dinero(mes.total_ingresos)}
              icono="arrow-upward"
              colorAcento={tema.colores.ingreso}
            />
            <TarjetaMetrica
              etiqueta={t('capacitaciones.reporte.gastos')}
              valor={dinero(mes.total_gastos)}
              icono="arrow-downward"
              colorAcento={tema.colores.gasto}
            />
          </View>
          <View style={estilos.filaMetricas}>
            <TarjetaMetrica
              etiqueta={t('capacitaciones.reporte.saldoNeto')}
              valor={dinero(mes.saldo_neto)}
              icono="account-balance-wallet"
            />
            <TarjetaMetrica
              etiqueta={t('capacitaciones.reporte.movimientos')}
              valor={String(mes.cantidad_movimientos)}
              icono="receipt-long"
            />
          </View>
        </TarjetaCristal>
      ))}

      <Text style={[estilos.subtituloSeccion, { color: tema.colores.textoPrincipal }]}>
        {t('capacitaciones.reporte.movimientosRecientesTitulo')}
      </Text>

      {!cargando && movimientos.length === 0 ? (
        <MensajeError mensaje={t('capacitaciones.reporte.sinMovimientos')} />
      ) : null}

      {movimientos.map((movimiento) => (
        <TarjetaCristal key={movimiento.id} estilo={estilos.filaMovimiento}>
          <View style={estilos.infoMovimiento}>
            <Text style={[estilos.descripcionMovimiento, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {movimiento.descripcion}
            </Text>
            <Text style={[estilos.metaMovimiento, { color: tema.colores.textoSecundario }]}>
              {movimiento.categoria} · {movimiento.fecha}
            </Text>
          </View>
          <Text
            style={[
              estilos.montoMovimiento,
              { color: movimiento.tipo === 'ingreso' ? tema.colores.ingreso : tema.colores.gasto },
            ]}
          >
            {movimiento.tipo === 'ingreso' ? '+' : '-'}
            {dinero(Number(movimiento.monto))}
          </Text>
        </TarjetaCristal>
      ))}
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  banner: { borderRadius: 8, padding: 20, gap: 7 },
  insignia: { color: '#C9F2DE', fontSize: 12, letterSpacing: 1, fontFamily: FUENTES.negrita },
  titulo: { color: '#FFFFFF', fontSize: 26, fontFamily: FUENTE_DISPLAY.negrita },
  subtitulo: { color: '#DCF5E9', fontSize: 14, lineHeight: 20 },
  menu: { gap: 10 },
  descripcionMenu: { fontSize: 13, lineHeight: 18, marginTop: -4 },
  tarjetaMes: { gap: 12 },
  periodo: { fontSize: 16, fontFamily: FUENTES.negrita },
  filaMetricas: { flexDirection: 'row', gap: 10 },
  subtituloSeccion: { fontSize: 16, fontFamily: FUENTES.seminegrita, marginTop: 8 },
  filaMovimiento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoMovimiento: { flex: 1, gap: 2 },
  descripcionMovimiento: { fontSize: 14, fontFamily: FUENTES.seminegrita },
  metaMovimiento: { fontSize: 12 },
  montoMovimiento: { fontSize: 14, fontFamily: FUENTES.negrita },
});
