import { obtenerAsteroidesCercanos, obtenerImagenAstronomicaDelDia } from '@/src/servicios/nasa/apiNASA';

describe('API de NASA', () => {
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_NASA_API_KEY = 'token-de-prueba';
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    delete process.env.EXPO_PUBLIC_NASA_API_KEY;
    jest.restoreAllMocks();
  });

  it('envía el token al recurso APOD', async () => {
    const imagen = {
      date: '2026-08-18',
      explanation: 'Una galaxia.',
      media_type: 'image' as const,
      service_version: 'v1',
      title: 'Galaxia',
      url: 'https://example.com/galaxia.jpg',
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => imagen });

    await expect(obtenerImagenAstronomicaDelDia()).resolves.toEqual(imagen);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.nasa.gov/planetary/apod?thumbs=true&api_key=token-de-prueba'
    );
  });

  it('normaliza y ordena los asteroides por distancia', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        near_earth_objects: {
          '2026-08-18': [
            {
              id: '2',
              name: '(Lejano)',
              is_potentially_hazardous_asteroid: false,
              nasa_jpl_url: 'https://example.com/2',
              estimated_diameter: { meters: { estimated_diameter_min: 20, estimated_diameter_max: 40 } },
              close_approach_data: [{
                close_approach_date: '2026-08-18',
                relative_velocity: { kilometers_per_hour: '12000' },
                miss_distance: { kilometers: '500000' },
              }],
            },
            {
              id: '1',
              name: '(Cercano)',
              is_potentially_hazardous_asteroid: true,
              nasa_jpl_url: 'https://example.com/1',
              estimated_diameter: { meters: { estimated_diameter_min: 10, estimated_diameter_max: 30 } },
              close_approach_data: [{
                close_approach_date: '2026-08-18',
                relative_velocity: { kilometers_per_hour: '9000' },
                miss_distance: { kilometers: '100000' },
              }],
            },
          ],
        },
      }),
    });

    const resultado = await obtenerAsteroidesCercanos('2026-08-18');

    expect(resultado.map((asteroide) => asteroide.id)).toEqual(['1', '2']);
    expect(resultado[0]).toMatchObject({ nombre: 'Cercano', peligroso: true, distanciaKilometros: 100000 });
  });
});
