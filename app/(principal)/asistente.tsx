import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BurbujaChat } from '@/src/componentes/asistente/BurbujaChat';
import { PreguntaSugerida } from '@/src/componentes/asistente/PreguntaSugerida';
import { CampoTexto } from '@/src/componentes/comunes/CampoTexto';
import { Icono } from '@/src/componentes/comunes/Icono';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { useIdioma } from '@/src/contextos/ContextoIdioma';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { consultarAsistenteIA } from '@/src/servicios/asistente/asistenteIA';
import { detectarIntencion } from '@/src/servicios/asistente/detectorIntencion';
import { generarRespuesta } from '@/src/servicios/asistente/generadorRespuestas';
import { calcularResumenPeriodo, obtenerRangoMesActual } from '@/src/utilidades/calculosFinancieros';
import { calcularCategoriaConMayorGasto } from '@/src/utilidades/calculosAnalisis';
import { nombreCategoria } from '@/src/utilidades/nombreCategoria';

interface MensajeChat {
  id: string;
  contenido: string;
  esUsuario: boolean;
  hora: string;
  datosUtilizados?: string;
}

function horaActual(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function PantallaAsistente() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const { idioma } = useIdioma();
  const insets = useSafeAreaInsets();
  const { movimientos, categorias, cuentas } = useFinanzas();
  const { metas } = usePlanificacion();
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);

  const sugerencias = t('pantallas.asistente.sugerencias', { returnObjects: true }) as string[];
  const moneda = cuentas[0]?.moneda ?? 'GTQ';

  const enviarMensaje = (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio) return;

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const mensajeUsuario: MensajeChat = {
      id: `u-${Date.now()}`,
      contenido: limpio,
      esUsuario: true,
      hora: horaActual(),
    };
    setMensajes((previos) => [...previos, mensajeUsuario]);
    setTexto('');
    setEscribiendo(true);

    // Nivel 1: la pregunta se responde localmente, sin enviar datos financieros a
    // ningún servicio externo. Solo si el motor local no reconoce el patrón se
    // intenta el Nivel 2 (Edge Function con IA) enviando únicamente un resumen
    // agregado — nunca el detalle de movimientos. Si esa función no está
    // desplegada o configurada, se cae de vuelta al mensaje local con honestidad.
    (async () => {
      const intencion = detectarIntencion(limpio, idioma);
      const resultado = generarRespuesta(intencion, { movimientos, categorias, cuentas, metas, moneda, idioma }, t);
      let respuesta = resultado.texto;
      let datosUtilizados: string | undefined = resultado.datosUtilizados;

      if (intencion.tipo === 'noEntendido') {
        const rango = obtenerRangoMesActual();
        const resumenMes = calcularResumenPeriodo(
          movimientos.filter((m) => m.fechaMovimiento >= rango.inicio && m.fechaMovimiento <= rango.fin)
        );
        const mayorGasto = calcularCategoriaConMayorGasto(movimientos, categorias);
        const respuestaIA = await consultarAsistenteIA(
          limpio,
          {
            periodo: rango.inicio.slice(0, 7),
            ingresos: resumenMes.ingresos,
            gastos: resumenMes.gastos,
            ahorroNeto: resumenMes.ahorroNeto,
            tasaAhorro: resumenMes.tasaAhorro,
            moneda,
            categoriaMayorGasto: mayorGasto ? nombreCategoria(mayorGasto.categoria, t) : undefined,
          },
          idioma
        );
        if (respuestaIA) {
          respuesta = respuestaIA;
          datosUtilizados = t('pantallas.asistente.datosUtilizadosMesActual');
        } else {
          datosUtilizados = undefined;
        }
      }

      setMensajes((previos) => [
        ...previos,
        {
          id: `a-${Date.now()}`,
          contenido: respuesta,
          esUsuario: false,
          hora: horaActual(),
          datosUtilizados,
        },
      ]);
      setEscribiendo(false);
    })();
  };

  return (
    <KeyboardAvoidingView
      style={[estilos.raiz, { backgroundColor: tema.colores.fondoPrincipal, paddingTop: insets.top + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BlurView
        intensity={40}
        tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
        style={estilos.encabezado}
      >
        <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>
          {t('pantallas.asistente.titulo')}
        </Text>
        {mensajes.length > 0 ? (
          <Pressable onPress={() => setMensajes([])} accessibilityRole="button" accessibilityLabel={t('pantallas.asistente.borrarConversacion')}>
            <Icono nombre="delete-outline" tamano={20} color={tema.colores.textoSecundario} />
          </Pressable>
        ) : null}
      </BlurView>

      {mensajes.length === 0 ? (
        <View style={estilos.sugerenciasContenedor}>
          <Text style={[estilos.tituloSugerencias, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.asistente.preguntasSugeridas')}
          </Text>
          <View style={estilos.filaSugerencias}>
            {sugerencias.map((sugerencia) => (
              <PreguntaSugerida key={sugerencia} texto={sugerencia} onPress={() => enviarMensaje(sugerencia)} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={mensajes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.listaMensajes}
          renderItem={({ item }) => (
            <BurbujaChat
              contenido={item.contenido}
              esUsuario={item.esUsuario}
              hora={item.hora}
              datosUtilizados={item.datosUtilizados}
            />
          )}
          ListFooterComponent={
            escribiendo ? (
              <Text style={[estilos.escribiendo, { color: tema.colores.textoSecundario }]}>
                {t('pantallas.asistente.escribiendo')}
              </Text>
            ) : null
          }
        />
      )}

      <View style={estilos.entrada}>
        <View style={estilos.campo}>
          <CampoTexto
            etiqueta=""
            value={texto}
            onChangeText={setTexto}
            placeholder={t('pantallas.asistente.placeholder')}
            onSubmitEditing={() => enviarMensaje(texto)}
          />
        </View>
        <Pressable
          onPress={() => enviarMensaje(texto)}
          accessibilityRole="button"
          accessibilityLabel={t('pantallas.asistente.placeholder')}
        >
          <LinearGradient colors={tema.gradientePrincipal} style={estilos.botonEnviar}>
            <Icono nombre="send" tamano={20} color={tema.colores.sobrePrimario} />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    paddingHorizontal: 16,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
  },
  sugerenciasContenedor: {
    gap: 10,
    flex: 1,
  },
  tituloSugerencias: {
    fontSize: 13,
    fontWeight: '600',
  },
  filaSugerencias: {
    gap: 8,
  },
  listaMensajes: {
    gap: 10,
    paddingBottom: 12,
  },
  escribiendo: {
    fontSize: 12,
    marginTop: 4,
  },
  entrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingVertical: 12,
  },
  campo: {
    flex: 1,
  },
  botonEnviar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
