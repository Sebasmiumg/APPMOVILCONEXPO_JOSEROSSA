import type { AsteroideCercanoNASA, ImagenAstronomicaNASA } from '@/src/tipos/nasa';

const URL_BASE_NASA = 'https://api.nasa.gov';

interface RespuestaAcercamientoNASA {
  close_approach_date: string;
  relative_velocity: { kilometers_per_hour: string };
  miss_distance: { kilometers: string };
}

interface AsteroideNASA {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  nasa_jpl_url: string;
  estimated_diameter: {
    meters: { estimated_diameter_min: number; estimated_diameter_max: number };
  };
  close_approach_data: RespuestaAcercamientoNASA[];
}

interface RespuestaNeoWsNASA {
  near_earth_objects: Record<string, AsteroideNASA[]>;
}

export class ErrorAPINASA extends Error {
  constructor(public readonly codigo: 'sin_clave' | 'limite' | 'respuesta') {
    super(codigo);
    this.name = 'ErrorAPINASA';
  }
}

function obtenerClaveNASA(): string {
  const clave = process.env.EXPO_PUBLIC_NASA_API_KEY?.trim();
  if (!clave) throw new ErrorAPINASA('sin_clave');
  return clave;
}

async function solicitarNASA<T>(recurso: string, parametros: Record<string, string> = {}): Promise<T> {
  const consulta = Object.entries({ ...parametros, api_key: obtenerClaveNASA() })
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(valor)}`)
    .join('&');
  const respuesta = await fetch(`${URL_BASE_NASA}${recurso}?${consulta}`);

  if (respuesta.status === 429) throw new ErrorAPINASA('limite');
  if (!respuesta.ok) throw new ErrorAPINASA('respuesta');
  return respuesta.json() as Promise<T>;
}

/** Recurso 1: Astronomy Picture of the Day (APOD). */
export function obtenerImagenAstronomicaDelDia(): Promise<ImagenAstronomicaNASA> {
  return solicitarNASA<ImagenAstronomicaNASA>('/planetary/apod', { thumbs: 'true' });
}

/** Recurso 2: objetos cercanos a la Tierra para una fecha (NeoWs Feed). */
export async function obtenerAsteroidesCercanos(fecha: string): Promise<AsteroideCercanoNASA[]> {
  const datos = await solicitarNASA<RespuestaNeoWsNASA>('/neo/rest/v1/feed', {
    start_date: fecha,
    end_date: fecha,
  });

  return Object.values(datos.near_earth_objects)
    .flat()
    .map((asteroide) => {
      const acercamiento = asteroide.close_approach_data[0];
      return {
        id: asteroide.id,
        nombre: asteroide.name.replace(/[()]/g, ''),
        peligroso: asteroide.is_potentially_hazardous_asteroid,
        diametroMinimoMetros: asteroide.estimated_diameter.meters.estimated_diameter_min,
        diametroMaximoMetros: asteroide.estimated_diameter.meters.estimated_diameter_max,
        distanciaKilometros: Number(acercamiento?.miss_distance.kilometers ?? 0),
        velocidadKilometrosHora: Number(acercamiento?.relative_velocity.kilometers_per_hour ?? 0),
        fechaAcercamiento: acercamiento?.close_approach_date ?? fecha,
        urlNASA: asteroide.nasa_jpl_url,
      };
    })
    .sort((a, b) => a.distanciaKilometros - b.distanciaKilometros);
}
