import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaMeta } from '@/src/componentes/metas/TarjetaMeta';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';

export default function PantallaMetas() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { cuentas } = useFinanzas();
  const { metas } = usePlanificacion();

  const monedaPorDefecto = cuentas[0]?.moneda ?? 'GTQ';

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <View style={estilos.encabezado}>
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('pantallas.metas.titulo')}</Text>
        </View>

        {metas.length === 0 ? (
          <EstadoVacio titulo={t('pantallas.metas.sinMetas')} icono="flag" />
        ) : (
          <View style={estilos.lista}>
            {metas.map((meta) => {
              const cuenta = cuentas.find((c) => c.id === meta.cuentaId);
              return (
                <TarjetaMeta
                  key={meta.id}
                  meta={meta}
                  moneda={cuenta?.moneda ?? monedaPorDefecto}
                  onPress={() => router.push(`/meta/${meta.id}`)}
                />
              );
            })}
          </View>
        )}

        <BotonPrincipal titulo={t('pantallas.metas.nuevaMeta')} onPress={() => router.push('/meta/nueva')} />
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
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  lista: {
    gap: 12,
  },
});
