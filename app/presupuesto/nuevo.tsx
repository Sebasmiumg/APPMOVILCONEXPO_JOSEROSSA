import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';

const PORCENTAJES_ALERTA = [50, 75, 80, 90, 100];

function periodoActualISO(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
}

export default function PantallaNuevoPresupuesto() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { categoriasPorTipo } = useFinanzas();
  const { presupuestos, crearPresupuesto } = usePlanificacion();

  const categoriasGasto = categoriasPorTipo('gasto');
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
        <View style={estilos.encabezado}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('presupuestos.titulo')}</Text>
          <Pressable onPress={() => volverOIrA(router, '/(principal)/analisis')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
            <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
          </Pressable>
        </View>

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

            <CampoMoneda etiqueta={t('presupuestos.limite')} valor={limite} onCambiarValor={setLimite} />

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
