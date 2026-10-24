// Prefijo + usuarioId porque la base local no está particionada por usuario
// (ver src/servicios/sincronizacion/descarga.ts): esto solo evita repetir la
// descarga en logins siguientes del MISMO usuario en este dispositivo.
export function claveDescargaInicial(usuarioId: string): string {
  return `mipresupuesto.descargaInicialCompleta.${usuarioId}`;
}

export const CLAVES_ALMACENAMIENTO = {
  tema: 'mipresupuesto.preferencia.tema',
  idioma: 'mipresupuesto.preferencia.idioma',
  configuracionInicialCompleta: 'mipresupuesto.configuracionInicialCompleta',
  configuracionFinancieraInicial: 'mipresupuesto.configuracionFinancieraInicial',
  modoDemostracion: 'mipresupuesto.modoDemostracion',
  nombreUsuarioDemo: 'mipresupuesto.nombreUsuarioDemo',
  correoUsuarioDemo: 'mipresupuesto.correoUsuarioDemo',
  bloqueoBiometricoActivado: 'mipresupuesto.bloqueoBiometricoActivado',
  // A qué usuario le pertenecen los datos que hay AHORA MISMO en la base
  // local (ver src/servicios/sincronizacion/descarga.ts): como la base local
  // no tiene columna usuario_id, es la única forma de notar que alguien
  // inició sesión con una cuenta distinta a la anterior en este dispositivo.
  usuarioDatosLocales: 'mipresupuesto.usuarioDatosLocales',
} as const;
