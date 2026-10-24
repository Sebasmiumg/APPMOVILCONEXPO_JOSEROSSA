import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FUENTES } from '@/src/temas/tipografia';

import { useTema } from '@/src/contextos/ContextoTema';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { formatearFechaSoloDia } from '@/src/utilidades/fechas';

interface PropiedadesSelectorFecha {
  etiqueta: string;
  valor: Date | null;
  onCambiar: (fecha: Date) => void;
  fechaMinima?: Date;
}

type FormatoFecha = 'dma' | 'mdy' | 'amd';

const FORMATO_POR_IDIOMA: Record<string, FormatoFecha> = {
  es: 'dma',
  en: 'mdy',
  zh: 'amd',
  hi: 'dma',
  ar: 'dma',
};

const TEXTO_FECHA_INVALIDA: Record<string, string> = {
  es: 'Escribe una fecha válida con el formato indicado.',
  en: 'Enter a valid date in the indicated format.',
  zh: '请按指定格式输入有效日期。',
  hi: 'दिए गए प्रारूप में सही तारीख दर्ज करें।',
  ar: 'أدخل تاريخًا صحيحًا بالتنسيق الموضح.',
};

const TEXTO_FECHA_ANTERIOR: Record<string, string> = {
  es: 'La fecha debe ser hoy o posterior.',
  en: 'The date must be today or later.',
  zh: '日期必须是今天或之后。',
  hi: 'तारीख आज या उसके बाद की होनी चाहिए।',
  ar: 'يجب أن يكون التاريخ اليوم أو بعده.',
};

function crearFecha(anio: number, mes: number, dia: number): Date | null {
  if (!anio || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  // setFullYear evita la regla de Date(year, ...) que convierte 0–99 en 1900–1999.
  const fecha = new Date(0);
  fecha.setHours(0, 0, 0, 0);
  fecha.setFullYear(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return null;
  return fecha;
}

function textoDeFecha(fecha: Date | null, formato: FormatoFecha): string {
  if (!fecha) return '';
  const anio = String(fecha.getFullYear()).padStart(4, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  if (formato === 'dma') return `${dia}/${mes}/${anio}`;
  if (formato === 'mdy') return `${mes}/${dia}/${anio}`;
  return `${anio}-${mes}-${dia}`;
}

function analizarTextoFecha(texto: string, formato: FormatoFecha): Date | null {
  const patron = formato === 'amd' ? /^(\d{4})-(\d{2})-(\d{2})$/ : /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const partes = texto.match(patron);
  if (!partes) return null;
  if (formato === 'dma') return crearFecha(Number(partes[3]), Number(partes[2]), Number(partes[1]));
  if (formato === 'mdy') return crearFecha(Number(partes[3]), Number(partes[1]), Number(partes[2]));
  return crearFecha(Number(partes[1]), Number(partes[2]), Number(partes[3]));
}

export function SelectorFecha({ etiqueta, valor, onCambiar, fechaMinima }: PropiedadesSelectorFecha) {
  const { tema } = useTema();
  const { idioma } = useIdioma();
  const formato = FORMATO_POR_IDIOMA[idioma] ?? 'dma';
  const ejemplo = formato === 'dma' ? 'DD/MM/AAAA' : formato === 'mdy' ? 'MM/DD/YYYY' : 'YYYY-MM-DD';
  const [texto, setTexto] = useState(() => textoDeFecha(valor, formato));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTexto(textoDeFecha(valor, formato));
    setError(null);
  }, [valor, formato]);

  const manejarCambio = (evento: ChangeEvent<HTMLInputElement>) => {
    const nuevoTexto = evento.target.value;
    setTexto(nuevoTexto);
    setError(null);
    if (!nuevoTexto) return;

    const fecha = analizarTextoFecha(nuevoTexto, formato);
    if (!fecha) {
      if (nuevoTexto.length >= ejemplo.length) setError(TEXTO_FECHA_INVALIDA[idioma] ?? TEXTO_FECHA_INVALIDA.es);
      return;
    }

    if (fechaMinima) {
      const minimo = new Date(fechaMinima);
      minimo.setHours(0, 0, 0, 0);
      if (fecha < minimo) {
        setError(TEXTO_FECHA_ANTERIOR[idioma] ?? TEXTO_FECHA_ANTERIOR.es);
        return;
      }
    }

    onCambiar(fecha);
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.etiqueta, { color: tema.colores.textoSecundario }]}>{etiqueta}</Text>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        aria-label={`${etiqueta} (${ejemplo})`}
        aria-invalid={error !== null}
        placeholder={ejemplo}
        maxLength={10}
        value={texto}
        onChange={manejarCambio}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          borderRadius: tema.radios.boton,
          borderColor: error ? tema.colores.gasto : tema.colores.borde,
          backgroundColor: tema.colores.tarjeta,
          color: tema.colores.textoPrincipal,
          minHeight: tema.alturaControlMinima,
          fontSize: 16,
          borderWidth: 1,
          borderStyle: 'solid',
          paddingLeft: 14,
          paddingRight: 14,
          fontFamily: 'inherit',
        }}
      />
      {error ? <Text accessibilityRole="alert" style={[estilos.error, { color: tema.colores.gasto }]}>{error}</Text> : null}
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
  error: {
    fontSize: 12,
    fontFamily: FUENTES.medio,
  },
});
