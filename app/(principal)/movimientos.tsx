import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';

import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { ChipCategoria } from '@/src/componentes/comunes/ChipCategoria';
import { EstadoVacio } from '@/src/componentes/comunes/EstadoVacio';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaMovimiento } from '@/src/componentes/movimientos/TarjetaMovimiento';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useTema } from '@/src/contextos/ContextoTema';
import type { TipoMovimiento } from '@/src/tipos/movimiento';

const TIPOS_FILTRO: TipoMovimiento[] = ['ingreso', 'gasto', 'transferencia', 'ajuste'];

export default function PantallaMovimientos() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { movimientos, cuentas, categorias } = useFinanzas();

  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoMovimiento | null>(null);
  const [cuentaFiltro, setCuentaFiltro] = useState<string | null>(null);

  const movimientosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();
    return movimientos.filter((movimiento) => {
      if (tipoFiltro && movimiento.tipo !== tipoFiltro) return false;
      if (cuentaFiltro && movimiento.cuentaId !== cuentaFiltro && movimiento.cuentaDestinoId !== cuentaFiltro) return false;
      if (textoBusqueda) {
        const coincide =
          movimiento.descripcion?.toLowerCase().includes(textoBusqueda) ||
          movimiento.notas?.toLowerCase().includes(textoBusqueda);
        if (!coincide) return false;
      }
      return true;
    });
  }, [movimientos, tipoFiltro, cuentaFiltro, busqueda]);

  const categoriaPorId = useMemo(() => new Map(categorias.map((categoria) => [categoria.id, categoria])), [categorias]);
  const cuentaPorId = useMemo(() => new Map(cuentas.map((cuenta) => [cuenta.id, cuenta])), [cuentas]);

  const abrirMovimiento = (id: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(`/movimiento/${id}`);
  };

  return (
    <LayoutResponsive conDesplazamiento={false}>
      <View style={estilos.contenedor}>
        <BlurView
          intensity={30}
          tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
          style={estilos.tarjetaTitulo}
        >
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
            {t('pantallas.movimientos.titulo')}
          </Text>
        </BlurView>

        <CampoTexto
          etiqueta=""
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder={t('pantallas.movimientos.buscarPlaceholder')}
        />

        <View style={estilos.filaChips}>
          {TIPOS_FILTRO.map((tipo) => (
            <ChipCategoria
              key={tipo}
              etiqueta={t(`pantallas.movimientoNuevo.${tipo}`)}
              seleccionado={tipoFiltro === tipo}
              onPress={() => setTipoFiltro((actual) => (actual === tipo ? null : tipo))}
            />
          ))}
        </View>
        {cuentas.length > 1 ? (
          <View style={estilos.filaChips}>
            {cuentas.map((cuenta) => (
              <ChipCategoria
                key={cuenta.id}
                etiqueta={cuenta.nombre}
                seleccionado={cuentaFiltro === cuenta.id}
                onPress={() => setCuentaFiltro((actual) => (actual === cuenta.id ? null : cuenta.id))}
              />
            ))}
          </View>
        ) : null}

        <FlatList
          data={movimientosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          renderItem={({ item }) => (
            <TarjetaMovimiento
              movimiento={item}
              categoria={item.categoriaId ? categoriaPorId.get(item.categoriaId) : undefined}
              cuenta={cuentaPorId.get(item.cuentaId)}
              cuentaDestino={item.cuentaDestinoId ? cuentaPorId.get(item.cuentaDestinoId) : undefined}
              onPress={() => abrirMovimiento(item.id)}
            />
          )}
          ListEmptyComponent={
            <EstadoVacio titulo={t('pantallas.movimientos.sinMovimientos')} icono="receipt-long" />
          }
        />
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    gap: 12,
    paddingTop: 16,
  },
  tarjetaTitulo: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lista: {
    gap: 10,
    paddingBottom: 32,
  },
});
