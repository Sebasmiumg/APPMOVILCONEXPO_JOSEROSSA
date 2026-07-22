import type { AlternativaReinversion } from '@/src/tipos/reinversion';

const FECHA_CONSULTA = '2026-07-22';

// Alternativas educativas investigadas mediante búsqueda web en fuentes oficiales
// (bancos centrales, reguladores y entidades financieras supervisadas), priorizando
// Guatemala. El texto visible (nombre, descripción, ventajas, riesgos) vive en los
// archivos de idioma bajo la clave "reinversion.alternativas.<claveTraduccion>" —
// ver src/idiomas/*.json. Esto es contenido de referencia cacheado localmente;
// supabase/functions/busqueda-recomendaciones prepara una búsqueda en vivo futura.
export const ALTERNATIVAS_REINVERSION_SEMILLA: readonly AlternativaReinversion[] = [
  {
    id: 'cooperativa-ahorro-regulada',
    interes: 'ahorro',
    claveTraduccion: 'cooperativaAhorro',
    capitalMinimo: 'Q1,000',
    riesgo: 'bajo',
    pais: 'guatemala',
    fechaConsulta: FECHA_CONSULTA,
    verificado: true,
    fuentes: [
      {
        titulo: 'Panorama de las cooperativas de ahorro y crédito',
        entidad: 'Banco de Guatemala',
        url: 'https://banguat.gob.gt/page/i2d-panorama-de-las-cooperativas-de-ahorro-y-credito',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'bancoCentral',
      },
    ],
  },
  {
    id: 'intecap-capacitate-empleo',
    interes: 'formacion',
    claveTraduccion: 'intecapFormacion',
    capitalMinimo: 'Q0',
    riesgo: 'bajo',
    pais: 'guatemala',
    fechaConsulta: FECHA_CONSULTA,
    verificado: true,
    fuentes: [
      {
        titulo: 'Capacítate para el Empleo',
        entidad: 'INTECAP y Fundación Carlos Slim',
        url: 'https://www.intecap.edu.gt/centros/cti/cursosprogramados/',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'institucional',
      },
      {
        titulo: 'ABC de Educación Financiera',
        entidad: 'Superintendencia de Bancos de Guatemala',
        url: 'https://www.sib.gob.gt/web/sib/educacion-financiera/ABC-de-Educacion-Financiera',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'regulador',
      },
    ],
  },
  {
    id: 'credito-productivo-herramientas',
    interes: 'herramientas',
    claveTraduccion: 'creditoProductivo',
    capitalMinimo: 'Variable',
    riesgo: 'medio',
    pais: 'guatemala',
    fechaConsulta: FECHA_CONSULTA,
    verificado: true,
    fuentes: [
      {
        titulo: 'Créditos para MiPymes',
        entidad: 'Banrural',
        url: 'https://www.banrural.com.gt/site/mipymes/creditos',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'entidadFinanciera',
      },
    ],
  },
  {
    id: 'credito-amigo-microempresario',
    interes: 'microemprendimiento',
    claveTraduccion: 'creditoMicroempresario',
    capitalMinimo: 'Variable',
    riesgo: 'medio',
    pais: 'guatemala',
    fechaConsulta: FECHA_CONSULTA,
    verificado: true,
    fuentes: [
      {
        titulo: 'Crédito Amigo Microempresario',
        entidad: 'Banrural',
        url: 'https://www.banrural.com.gt/site/mipymes/creditos/credito-amigo-microempresario',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'entidadFinanciera',
      },
    ],
  },
  {
    id: 'banca-desarrollo-mipyme',
    interes: 'negocioExistente',
    claveTraduccion: 'bancaDesarrolloMipyme',
    capitalMinimo: 'Variable',
    riesgo: 'medio',
    pais: 'guatemala',
    fechaConsulta: FECHA_CONSULTA,
    verificado: false,
    fuentes: [
      {
        titulo: 'Crédito del fondo para Micro, Pequeñas y Medianas Empresas',
        entidad: 'Ministerio de Economía (MINECO)',
        url: 'https://www.startkit.org/productos-financieros/cr%C3%A9dito-del-fondo-para-micro,-peque%C3%B1as-y-medianas-empresas-(mineco)',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'institucional',
      },
    ],
  },
  {
    id: 'certibonos-pequeno-inversionista',
    interes: 'inversionRegulada',
    claveTraduccion: 'certibonos',
    capitalMinimo: 'Q5,000',
    riesgo: 'bajo',
    pais: 'guatemala',
    fechaConsulta: FECHA_CONSULTA,
    verificado: true,
    fuentes: [
      {
        titulo: 'Bonos del Tesoro para pequeños inversionistas: cómo invertir desde Q5 mil y ganar hasta 6.25%',
        entidad: 'Ministerio de Finanzas Públicas / Prensa Libre',
        url: 'https://www.prensalibre.com/economia/bonos-del-tesoro-para-pequenos-inversionistas-como-invertir-desde-q5-mil-y-ganar-hasta-6-25/',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'institucional',
      },
      {
        titulo: 'Convocatoria para licitación pública de Certificados Representativos de Bonos del Tesoro',
        entidad: 'Banco de Guatemala',
        url: 'http://www.banguat.gob.gt/es/page/convocatoria-para-licitacion-publica-de-certificados-representativos-de-bonos-del-tesoro-de-la',
        fechaConsulta: FECHA_CONSULTA,
        tipoFuente: 'bancoCentral',
      },
    ],
  },
];
