import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { Icono } from '@/src/componentes/comunes/Icono';
import { useTema } from '@/src/contextos/ContextoTema';

interface PropiedadesSelectorFecha {
  etiqueta: string;
  valor: Date | null;
  onCambiar: (fecha: Date) => void;
  fechaMinima?: Date;
}

function formatearFechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function SelectorFecha({ etiqueta, valor, onCambiar, fechaMinima }: PropiedadesSelectorFecha) {
  const { tema } = useTema();
  const [mostrarSelector, setMostrarSelector] = useState(false);

  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.etiqueta, { color: tema.colores.textoSecundario }]}>{etiqueta}</Text>
      <Pressable
        onPress={() => setMostrarSelector(true)}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={[
          estilos.campo,
          {
            borderRadius: tema.radios.boton,
            borderColor: tema.colores.borde,
            backgroundColor: tema.colores.tarjeta,
            minHeight: tema.alturaControlMinima,
          },
        ]}
      >
        <Text style={{ color: valor ? tema.colores.textoPrincipal : tema.colores.textoSecundario, fontSize: 16 }}>
          {valor ? formatearFechaISO(valor) : 'AAAA-MM-DD'}
        </Text>
        <Icono nombre="calendar-today" tamano={18} color={tema.colores.textoSecundario} />
      </Pressable>

      {mostrarSelector ? (
        <DateTimePicker
          value={valor ?? new Date()}
          mode="date"
          minimumDate={fechaMinima}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(evento, fechaSeleccionada) => {
            setMostrarSelector(Platform.OS === 'ios');
            if (evento.type === 'set' && fechaSeleccionada) {
              onCambiar(fechaSeleccionada);
            }
            if (Platform.OS !== 'ios') {
              setMostrarSelector(false);
            }
          }}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 6,
  },
  etiqueta: {
    fontSize: 13,
    fontFamily: FUENTES.medio,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 14,
  },
});
