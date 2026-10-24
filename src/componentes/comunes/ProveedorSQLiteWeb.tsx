import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  databaseName: string;
  onInit: (db: SQLiteDatabase) => Promise<void>;
  children: ReactNode;
};

const NOMBRE_BLOQUEO = 'mipresupuesto-sqlite-opfs';

/**
 * expo-sqlite web uses OPFS sync access handles, which are exclusive per file.
 * Keep one tab as the database owner and give other tabs a useful recovery UI.
 */
export function ProveedorSQLiteWeb({ databaseName, onInit, children }: Props) {
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState<'esperando' | 'listo' | 'ocupado'>('esperando');
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    let liberar: (() => void) | undefined;
    setEstado('esperando');
    setError(false);

    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks) {
      setEstado('listo');
      return () => { activo = false; };
    }

    setEstado('ocupado');
    void locks.request(NOMBRE_BLOQUEO, async () => {
      if (!activo) return;

      setEstado('listo');
      await new Promise<void>((resolve) => { liberar = resolve; });
    }).catch(() => {
      if (activo) setError(true);
    });

    return () => {
      activo = false;
      liberar?.();
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setError(false);
    setIntento((valor) => valor + 1);
  }, []);

  if (estado !== 'listo' || error) {
    const ocupado = estado === 'ocupado';
    return (
      <View style={estilos.pagina}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>
            {error ? 'No se pudo abrir el almacenamiento' : ocupado ? 'Esperando a que se libere la base de datos' : 'MiPresupuesto está cargando'}
          </Text>
          <Text style={estilos.detalle}>
            {error
              ? 'Cierra las otras pestañas de MiPresupuesto y vuelve a intentar. Tus datos guardados no se han eliminado.'
              : ocupado
                ? 'MiPresupuesto está abierto en otra pestaña. Esta ventana se activará automáticamente cuando se cierre la otra.'
                : 'Preparando el almacenamiento local…'}
          </Text>
          {error && (
            <Pressable accessibilityRole="button" onPress={reintentar} style={estilos.boton}>
              <Text style={estilos.textoBoton}>Reintentar</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <SQLiteProvider
      databaseName={databaseName}
      onInit={onInit}
      onError={() => { setTimeout(() => setError(true), 0); }}
    >
      {children}
    </SQLiteProvider>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    flex: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#070A18',
  },
  tarjeta: {
    width: '100%',
    maxWidth: 480,
    gap: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#33374F',
    borderRadius: 16,
    backgroundColor: '#11152A',
  },
  titulo: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
  detalle: { color: '#C5C9D8', fontSize: 15, lineHeight: 23 },
  boton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7C4DFF',
  },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
