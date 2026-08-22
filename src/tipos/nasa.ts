export interface ImagenAstronomicaNASA {
  copyright?: string;
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  service_version: string;
  thumbnail_url?: string;
  title: string;
  url: string;
}

export interface AsteroideCercanoNASA {
  id: string;
  nombre: string;
  peligroso: boolean;
  diametroMinimoMetros: number;
  diametroMaximoMetros: number;
  distanciaKilometros: number;
  velocidadKilometrosHora: number;
  fechaAcercamiento: string;
  urlNASA: string;
}

