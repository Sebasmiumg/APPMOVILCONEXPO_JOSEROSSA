import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { Icono } from '@/src/componentes/comunes/Icono';
import { MensajeError } from '@/src/componentes/comunes/MensajeError';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesPantallaBloqueo {
  error: boolean;
  onDesbloquear: () => void;
}

export function PantallaBloqueo({ error, onDesbloquear }: PropiedadesPantallaBloqueo) {
  const { tema } = useTema();
  const { t } = useTranslation();

  return (
    <View style={[estilos.contenedor, { backgroundColor: tema.colores.fondoPrincipal }]}>
      <View style={[estilos.icono, { backgroundColor: `${tema.colores.violeta}26` }]}>
        <Icono nombre="fingerprint" tamano={40} color={tema.colores.violeta} />
      </View>
      <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
        {t('seguridad.pantallaBloqueo.titulo')}
      </Text>
      <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
        {t('seguridad.pantallaBloqueo.descripcion')}
      </Text>
      {error ? <MensajeError mensaje={t('seguridad.pantallaBloqueo.error')} /> : null}
      <BotonPrincipal titulo={t('seguridad.pantallaBloqueo.desbloquear')} onPress={onDesbloquear} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
  },
  icono: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  descripcion: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});
