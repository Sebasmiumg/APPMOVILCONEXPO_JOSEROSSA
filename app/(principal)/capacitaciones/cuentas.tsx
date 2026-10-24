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
import { ErrorAPILaravel } from '@/src/servicios/laravelApi/cliente';
import { crearCuenta, eliminarCuenta, listarCuentas } from '@/src/servicios/laravelApi/cuentas';
import { FUENTE_DISPLAY, FUENTES } from '@/src/temas/tipografia';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';
import type { CuentaAPI } from '@/src/tipos/laravelApi';
import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

const MONEDAS = ['GTQ', 'USD'];

export default function PantallaCuentasAPI() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const router = useRouter();

  const [cuentas, setCuentas] = useState<CuentaAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [moneda, setMoneda] = useState('GTQ');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setCuentas(await listarCuentas());
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

  const dinero = (monto: number, monedaCuenta: string) => formatearMoneda(monto, monedaCuenta as 'GTQ' | 'USD', idioma);

  const registrar = async () => {
    const saldo = saldoInicial ? Number.parseFloat(saldoInicial) : 0;
    if (!nombre.trim() || !tipo.trim()) {
      setErrorFormulario(t('validaciones.campoRequerido'));
      return;
    }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorFormulario(undefined);
    setEnviando(true);
    try {
      await crearCuenta({ nombre: nombre.trim(), tipo: tipo.trim(), moneda, saldo_inicial: saldo });
      setNombre('');
      setTipo('');
      setSaldoInicial('');
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
    await eliminarCuenta(id);
    setCuentas((actual) => actual.filter((cuenta) => cuenta.id !== id));
  };

  return (
    <LayoutResponsive anchoMaximo={820}>
      <View style={estilos.encabezado}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('capacitaciones.cuentas.titulo')}</Text>
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
        {t('capacitaciones.cuentas.descripcion')}
      </Text>

      <TarjetaCristal estilo={estilos.formulario}>
        <Text style={[estilos.subtitulo, { color: tema.colores.textoPrincipal }]}>
          {t('capacitaciones.cuentas.nuevoTitulo')}
        </Text>

        <CampoTexto etiqueta={t('capacitaciones.cuentas.nombre')} value={nombre} onChangeText={setNombre} />
        <CampoTexto
          etiqueta={t('capacitaciones.cuentas.tipo')}
          value={tipo}
          onChangeText={setTipo}
          placeholder="efectivo, cuentaBancaria, cuentaAhorro, tarjetaCredito, negocio, billeteraDigital"
        />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('capacitaciones.cuentas.moneda')}
          </Text>
          <View style={estilos.filaChips}>
            {MONEDAS.map((valor) => (
              <ChipCategoria key={valor} etiqueta={valor} seleccionado={moneda === valor} onPress={() => setMoneda(valor)} />
            ))}
          </View>
        </View>

        <CampoMoneda
          etiqueta={t('capacitaciones.cuentas.saldoInicial')}
          valor={saldoInicial}
          onCambiarValor={setSaldoInicial}
        />

        {errorFormulario ? <MensajeError mensaje={errorFormulario} /> : null}

        <BotonPrincipal titulo={t('capacitaciones.cuentas.crear')} onPress={registrar} cargando={enviando} />
      </TarjetaCristal>

      {cargando ? <Cargador etiqueta={t('capacitaciones.cargando')} /> : null}
      {error ? <MensajeError mensaje={error} etiquetaReintentar={t('comun.reintentar')} onReintentar={cargar} /> : null}

      {!cargando && !error && cuentas.length === 0 ? (
        <EstadoVacio icono="account-balance-wallet" titulo={t('capacitaciones.cuentas.sinDatos')} />
      ) : null}

      {cuentas.map((cuenta) => (
        <TarjetaCristal key={cuenta.id} estilo={estilos.fila}>
          <View style={estilos.info}>
            <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]} numberOfLines={1}>
              {cuenta.nombre}
            </Text>
            <Text style={[estilos.meta, { color: tema.colores.textoSecundario }]}>
              {cuenta.tipo} · {dinero(Number(cuenta.saldo_inicial), cuenta.moneda)}
            </Text>
          </View>
          <Pressable
            onPress={() => setIdAEliminar(cuenta.id)}
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
