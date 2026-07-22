import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { CampoMoneda } from '@/src/componentes/comunes/CampoMoneda';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaAlternativa } from '@/src/componentes/reinversion/TarjetaAlternativa';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useTema } from '@/src/contextos/ContextoTema';
import { ALTERNATIVAS_REINVERSION_SEMILLA } from '@/src/servicios/reinversion/alternativasSemilla';
import { SIMBOLOS_MONEDA } from '@/src/constantes/finanzas';
import type { InteresReinversion } from '@/src/tipos/reinversion';

const INTERESES: { valor: InteresReinversion; icono: NombreIcono }[] = [
  { valor: 'ahorro', icono: 'savings' },
  { valor: 'formacion', icono: 'school' },
  { valor: 'herramientas', icono: 'build' },
  { valor: 'microemprendimiento', icono: 'storefront' },
  { valor: 'negocioExistente', icono: 'business-center' },
  { valor: 'inversionRegulada', icono: 'account-balance' },
];

export default function PantallaReinversion() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { cuentas } = useFinanzas();
  const [monto, setMonto] = useState('');
  const [interesSeleccionado, setInteresSeleccionado] = useState<InteresReinversion | null>(null);

  const moneda = cuentas[0]?.moneda ?? 'GTQ';

  const alternativas = useMemo(
    () => ALTERNATIVAS_REINVERSION_SEMILLA.filter((alt) => alt.interes === interesSeleccionado),
    [interesSeleccionado]
  );

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
          {t('pantallas.reinversion.titulo')}
        </Text>
        <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
          {t('pantallas.reinversion.descripcion')}
        </Text>

        <View
          style={[
            estilos.aviso,
            { borderRadius: tema.radios.tarjeta, borderColor: tema.colores.advertencia, backgroundColor: `${tema.colores.advertencia}1A` },
          ]}
        >
          <Icono nombre="info-outline" tamano={20} color={tema.colores.advertencia} />
          <Text style={[estilos.textoAviso, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.reinversion.aviso')}
          </Text>
        </View>

        <CampoMoneda
          etiqueta={t('pantallas.reinversion.montoAConsiderar')}
          valor={monto}
          onCambiarValor={setMonto}
          simboloMoneda={SIMBOLOS_MONEDA[moneda]}
        />

        <View style={estilos.grupo}>
          <Text style={[estilos.etiquetaGrupo, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.reinversion.seleccionaInteres')}
          </Text>
          <View style={estilos.filaChips}>
            {INTERESES.map((item) => (
              <ChipCategoria
                key={item.valor}
                etiqueta={t(`reinversion.intereses.${item.valor}`)}
                icono={item.icono}
                seleccionado={interesSeleccionado === item.valor}
                onPress={() => setInteresSeleccionado(item.valor)}
              />
            ))}
          </View>
        </View>

        {interesSeleccionado ? (
          alternativas.length === 0 ? (
            <EstadoVacio titulo={t('pantallas.reinversion.sinResultados')} icono="search-off" />
          ) : (
            <View style={estilos.listaAlternativas}>
              {alternativas.map((alternativa) => (
                <TarjetaAlternativa key={alternativa.id} alternativa={alternativa} />
              ))}
            </View>
          )
        ) : (
          <EstadoVacio titulo={t('pantallas.reinversion.seleccionaInteres')} icono="trending-up" />
        )}
      </View>
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
  descripcion: {
    fontSize: 14,
  },
  aviso: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: 'flex-start',
  },
  textoAviso: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
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
  listaAlternativas: {
    gap: 12,
  },
});
