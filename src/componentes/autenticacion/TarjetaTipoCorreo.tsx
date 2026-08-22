import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono, type NombreIcono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';
import type { ClasificacionCorreo } from '@/src/tipos/correo';

const ICONO_POR_TIPO: Record<ClasificacionCorreo['tipo'], NombreIcono> = {
  personal: 'person',
  institucional: 'school',
  organizacional: 'business',
};

export function TarjetaTipoCorreo({ tipo, dominio }: ClasificacionCorreo) {
  const { tema } = useTema();
  const { t } = useTranslation();

  return (
    <View
      style={[
        estilos.contenedor,
        { borderRadius: tema.radios.tarjeta, borderColor: tema.colores.borde, backgroundColor: tema.colores.tarjeta },
      ]}
      accessibilityRole="text"
    >
      <View style={[estilos.icono, { backgroundColor: `${tema.colores.azul}26` }]}>
        <Icono nombre={ICONO_POR_TIPO[tipo]} tamano={18} color={tema.colores.azul} />
      </View>
      <View style={estilos.textos}>
        <Text style={[estilos.tipo, { color: tema.colores.textoPrincipal }]}>
          {t(`autenticacion.tipoCorreo.${tipo}`)}
        </Text>
        <Text style={[estilos.dominio, { color: tema.colores.textoSecundario }]}>
          {t('autenticacion.tipoCorreo.dominioDetectado', { dominio })}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  icono: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  tipo: {
    fontSize: 14,
    fontFamily: FUENTES.negrita,
  },
  dominio: {
    fontSize: 12,
  },
});
