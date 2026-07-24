import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BotonPrincipal } from '@/src/componentes/comunes/BotonPrincipal';
import { BotonSecundario } from '@/src/componentes/comunes/BotonSecundario';
import { Icono } from '@/src/componentes/comunes/Icono';
import { LayoutResponsive } from '@/src/componentes/comunes/LayoutResponsive';
import { TarjetaCristal } from '@/src/componentes/comunes/TarjetaCristal';
import { useFinanzas } from '@/src/contextos/ContextoFinanzas';
import { usePlanificacion } from '@/src/contextos/ContextoPlanificacion';
import { useTema } from '@/src/contextos/ContextoTema';
import { exportarDatosUsuario } from '@/src/servicios/exportacion/exportarDatosUsuario';
import { supabaseEstaConfigurado } from '@/src/servicios/supabase/cliente';
import { volverOIrA } from '@/src/utilidades/navegacionSegura';

export default function PantallaPrivacidad() {
  const { tema } = useTema();
  const { t } = useTranslation();
  const router = useRouter();
  const { cuentas, categorias, movimientos } = useFinanzas();
  const { presupuestos, metas, obtenerAportesMeta } = usePlanificacion();
  const [exportando, setExportando] = useState(false);
  const nubeActiva = supabaseEstaConfigurado();

  const exportarDatos = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExportando(true);
    try {
      await exportarDatosUsuario({ cuentas, categorias, movimientos, presupuestos, metas, obtenerAportesMeta });
    } finally {
      setExportando(false);
    }
  };

  return (
    <LayoutResponsive>
      <View style={estilos.contenedor}>
        <BlurView
          intensity={30}
          tint={tema.modo === 'oscuro' ? 'dark' : 'light'}
          style={estilos.encabezado}
        >
          <Text style={[estilos.titulo, { color: tema.colores.textoPrincipal }]}>{t('pantallas.privacidad.titulo')}</Text>
          <Pressable onPress={() => volverOIrA(router, '/(principal)/perfil')} accessibilityRole="button" accessibilityLabel={t('comun.cerrar')} hitSlop={12}>
            <Icono nombre="close" tamano={22} color={tema.colores.textoSecundario} />
          </Pressable>
        </BlurView>

        <TarjetaCristal>
          <View style={estilos.filaTitulo}>
            <Icono nombre="smartphone" tamano={18} color={tema.colores.violeta} />
            <Text style={[estilos.tituloTarjeta, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.privacidad.localTitulo')}
            </Text>
          </View>
          <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.privacidad.localDescripcion')}
          </Text>
        </TarjetaCristal>

        <TarjetaCristal>
          <View style={estilos.filaTitulo}>
            <Icono nombre={nubeActiva ? 'cloud-done' : 'cloud-off'} tamano={18} color={nubeActiva ? tema.colores.ingreso : tema.colores.textoSecundario} />
            <Text style={[estilos.tituloTarjeta, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.privacidad.nubeTitulo')}
            </Text>
          </View>
          <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
            {nubeActiva ? t('pantallas.privacidad.nubeActivaDescripcion') : t('pantallas.privacidad.nubeInactivaDescripcion')}
          </Text>
        </TarjetaCristal>

        <TarjetaCristal>
          <View style={estilos.filaTitulo}>
            <Icono nombre="smart-toy" tamano={18} color={tema.colores.violeta} />
            <Text style={[estilos.tituloTarjeta, { color: tema.colores.textoPrincipal }]}>
              {t('pantallas.privacidad.asistenteTitulo')}
            </Text>
          </View>
          <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.privacidad.asistenteDescripcion')}
          </Text>
        </TarjetaCristal>

        <BotonPrincipal
          titulo={exportando ? t('pantallas.reporte.generando') : t('pantallas.privacidad.exportarBoton')}
          onPress={exportarDatos}
          cargando={exportando}
        />

        <View style={estilos.bloqueEliminar}>
          <Text style={[estilos.descripcion, { color: tema.colores.textoSecundario }]}>
            {t('pantallas.privacidad.eliminarDescripcion')}
          </Text>
          <BotonSecundario titulo={t('pantallas.privacidad.eliminarBoton')} onPress={() => volverOIrA(router, '/(principal)/perfil')} />
        </View>
      </View>
    </LayoutResponsive>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    marginRight: 12,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tituloTarjeta: {
    fontSize: 14,
    fontWeight: '700',
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 19,
  },
  bloqueEliminar: {
    gap: 10,
    marginTop: 4,
  },
});
