export type InteresReinversion =
  | 'ahorro'
  | 'formacion'
  | 'herramientas'
  | 'microemprendimiento'
  | 'negocioExistente'
  | 'inversionRegulada';

export type NivelRiesgoReinversion = 'bajo' | 'medio' | 'alto';

export type TipoFuenteReinversion = 'regulador' | 'bancoCentral' | 'entidadFinanciera' | 'institucional';

export interface FuenteReinversion {
  titulo: string;
  entidad: string;
  url: string;
  fechaConsulta: string;
  tipoFuente: TipoFuenteReinversion;
}

export interface AlternativaReinversion {
  id: string;
  interes: InteresReinversion;
  claveTraduccion: string;
  capitalMinimo: string;
  riesgo: NivelRiesgoReinversion;
  pais: string;
  fechaConsulta: string;
  verificado: boolean;
  fuentes: FuenteReinversion[];
}
