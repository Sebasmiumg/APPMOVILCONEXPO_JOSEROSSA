import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono } from '@/src/componentes/comunes/Icono';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { TarjetaFuente } from '@/src/componentes/comunes/TarjetaFuente';
import { useTema } from '@/src/contextos/ContextoTema';
import type { AlternativaReinversion } from '@/src/tipos/reinversion';
import { analizarFechaSoloDia } from '@/src/utilidades/fechas';

interface PropiedadesTarjetaAlternativa {
  alternativa: AlternativaReinversion;
}

export function TarjetaAlternativa({ alternativa }: PropiedadesTarjetaAlternativa) {
  const { tema } = useTema();
  const { t } = useTranslation();
  const base = `reinversion.alternativas.${alternativa.claveTraduccion}`;

  const colorRiesgo = {
    bajo: tema.colores.ingreso,
    medio: tema.colores.advertencia,
    alto: tema.colores.gasto,
  }[alternativa.riesgo];

  return (
    <TarjetaCristal>
      <View
        style={estilos.encabezado}
        accessible
        accessibilityLabel={`${t(`${base}.nombre`)}. ${t('reinversion.camposFicha.riesgo')}: ${t(`reinversion.riesgo.${alternativa.riesgo}`)}`}
      >
        <Text style={[estilos.nombre, { color: tema.colores.textoPrincipal }]}>{t(`${base}.nombre`)}</Text>
        <View style={[estilos.chipRiesgo, { backgroundColor: `${colorRiesgo}26` }]}>
          <Text style={[estilos.textoChip, { color: colorRiesgo }]}>{t(`reinversion.riesgo.${alternativa.riesgo}`)}</Text>
        </View>
      </View>

      <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>{t(`${base}.descripcion`)}</Text>

      <View style={estilos.filaCampos}>
        <CampoFicha etiqueta={t('reinversion.camposFicha.capitalMinimo')} valor={alternativa.capitalMinimo} />
        <CampoFicha etiqueta={t('reinversion.camposFicha.liquidez')} valor={t(`${base}.liquidez`)} />
      </View>
      <CampoFicha etiqueta={t('reinversion.camposFicha.costos')} valor={t(`${base}.costos`)} />

      <View style={estilos.bloqueTexto}>
        <Text style={[estilos.etiquetaBloque, { color: tema.colores.ingreso }]}>{t('reinversion.camposFicha.ventajas')}</Text>
        <Text style={[estilos.textoBloque, { color: tema.colores.textoPrincipal }]}>{t(`${base}.ventajas`)}</Text>
      </View>
      <View style={estilos.bloqueTexto}>
        <Text style={[estilos.etiquetaBloque, { color: tema.colores.gasto }]}>{t('reinversion.camposFicha.riesgosPrincipales')}</Text>
        <Text style={[estilos.textoBloque, { color: tema.colores.textoPrincipal }]}>{t(`${base}.riesgos`)}</Text>
      </View>

      <View style={[estilos.filaTransparencia, { borderTopColor: tema.colores.borde }]}>
        <View style={estilos.filaTransparenciaItem}>
          <Icono nombre="public" tamano={14} color={tema.colores.textoSecundario} />
          <Text style={[estilos.textoTransparencia, { color: tema.colores.textoSecundario }]}>
            {t(`reinversion.pais.${alternativa.pais}`)}
          </Text>
        </View>
        <View style={estilos.filaTransparenciaItem}>
          <Icono
            nombre={alternativa.verificado ? 'verified' : 'help-outline'}
            tamano={14}
            color={alternativa.verificado ? tema.colores.ingreso : tema.colores.advertencia}
          />
          <Text style={[estilos.textoTransparencia, { color: tema.colores.textoSecundario }]}>
            {t(alternativa.verificado ? 'reinversion.camposFicha.estadoVerificado' : 'reinversion.camposFicha.estadoRequiereRevision')}
          </Text>
        </View>
        <View style={estilos.filaTransparenciaItem}>
          <Icono nombre="event" tamano={14} color={tema.colores.textoSecundario} />
          <Text style={[estilos.textoTransparencia, { color: tema.colores.textoSecundario }]}>
            {t('reinversion.camposFicha.fechaConsulta')}: {analizarFechaSoloDia(alternativa.fechaConsulta).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={estilos.fuentes}>
        {alternativa.fuentes.map((fuente) => (
          <TarjetaFuente key={fuente.url} {...fuente} />
        ))}
      </View>
    </TarjetaCristal>
  );
}

function CampoFicha({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const { tema } = useTema();
  return (
    <View style={estilos.campoFicha}>
      <Text style={[estilos.etiquetaCampo, { color: tema.colores.textoSecundario }]}>{etiqueta}</Text>
      <Text style={[estilos.valorCampo, { color: tema.colores.textoPrincipal }]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  nombre: {
    flex: 1,
    fontSize: 15,
    fontFamily: FUENTES.negrita,
  },
  chipRiesgo: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  textoChip: {
    fontSize: 11,
    fontFamily: FUENTES.negrita,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  filaCampos: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  campoFicha: {
    flex: 1,
    gap: 2,
  },
  etiquetaCampo: {
    fontSize: 11,
  },
  valorCampo: {
    fontSize: 13,
    fontFamily: FUENTES.seminegrita,
  },
  bloqueTexto: {
    marginTop: 8,
    gap: 2,
  },
  etiquetaBloque: {
    fontSize: 11,
    fontFamily: FUENTES.negrita,
  },
  textoBloque: {
    fontSize: 13,
    lineHeight: 18,
  },
  filaTransparencia: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  filaTransparenciaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoTransparencia: {
    fontSize: 11,
  },
  fuentes: {
    marginTop: 10,
    gap: 6,
  },
});
