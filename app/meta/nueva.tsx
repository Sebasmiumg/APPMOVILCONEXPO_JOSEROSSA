import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { SelectorFecha } from '@/src/componentes/comunes/SelectorFecha';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';

export default function PantallaNuevaMeta() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { cuentas } = useFinanzas();
  const { crearMeta } = usePlanificacion();

  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [montoActual, setMontoActual] = useState('');
  const [cuentaId, setCuentaId] = useState<string | undefined>();
  const [fechaObjetivo, setFechaObjetivo] = useState<Date | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    const objetivoNumerico = Number.parseFloat(montoObjetivo);
    if (!nombre.trim()) {
      setError(t('validaciones.campoRequerido'));
      return;
    }
    if (!objetivoNumerico || objetivoNumerico <= 0) {
      setError(t('validaciones.montoInvalido'));
      return;
    }
    setError(undefined);
    setEnviando(true);
    try {
      await crearMeta({
        nombre: nombre.trim(),
        montoObjetivo: objetivoNumerico,
        montoActual: montoActual ? Number.parseFloat(montoActual) : 0,
        cuentaId: cuentaId ?? null,
        fechaObjetivo: fechaObjetivo ? fechaObjetivo.toISOString().slice(0, 10) : null,
      });
      volverOIrA(router, '/(principal)/metas');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <View style={estilos.encabezado}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.metas.nuevaMeta')}
          </Text>
          <Pressable onPress={() => volverOIrA(router, '/(principal)/metas')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
            <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
          </Pressable>
        </View>

        <CampoTexto etiqueta={t('pantallas.metas.formulario.nombre')} value={nombre} onChangeText={setNombre} />

        <CampoMoneda
          etiqueta={t('pantallas.metas.formulario.montoObjetivo')}
          valor={montoObjetivo}
          onCambiarValor={setMontoObjetivo}
        />

        <CampoMoneda
          etiqueta={t('pantallas.metas.formulario.montoActualOpcional')}
          valor={montoActual}
          onCambiarValor={setMontoActual}
        />

        {cuentas.length > 0 ? (
          <View style={estilos.grupo}>
            <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
              {t('pantallas.metas.formulario.cuentaAsociada')}
            </Text>
            <View style={estilos.filaChips}>
              {cuentas.map((cuenta) => (
                <ChipCategoria
                  key={cuenta.id}
                  etiqueta={cuenta.nombre}
                  seleccionado={cuentaId === cuenta.id}
                  onPress={() => setCuentaId((actual) => (actual === cuenta.id ? undefined : cuenta.id))}
                />
              ))}
            </View>
          </View>
        ) : null}

        <SelectorFecha
          etiqueta={t('pantallas.metas.formulario.fechaObjetivoOpcional')}
          valor={fechaObjetivo}
          onCambiar={setFechaObjetivo}
          fechaMinima={new Date()}
        />

        {error ? <MensajeError mensaje={error} /> : null}

        <BotonPrincipal titulo={t('pantallas.metas.formulario.crear')} onPress={guardar} cargando={enviando} />
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
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
  },
  grupo: {
    gap: 8,
  },
  etiquetaGrupo: {
    fontSize: 13,
    fontWeight: '500',
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
