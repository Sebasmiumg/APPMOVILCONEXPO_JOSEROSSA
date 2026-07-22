import { detectarMesEnTexto } from '@/src/servicios/asistente/detectorMes';

describe('detectarMesEnTexto', () => {
  const fechaReferencia = new Date('2026-07-22T12:00:00.000Z');

  it('reconoce un mes anterior al actual dentro del mismo año', () => {
    const resultado = detectarMesEnTexto('¿Cuánto gasté en marzo?', 'es', fechaReferencia);
    expect(resultado).not.toBeNull();
    expect(resultado?.inicio.startsWith('2026-03')).toBe(true);
  });

  it('asume el año anterior cuando el mes nombrado aún no ha ocurrido este año', () => {
    const resultado = detectarMesEnTexto('¿Cuáles fueron mis gastos de diciembre?', 'es', fechaReferencia);
    expect(resultado).not.toBeNull();
    expect(resultado?.inicio.startsWith('2025-12')).toBe(true);
  });

  it('retorna null cuando no se menciona ningún mes', () => {
    expect(detectarMesEnTexto('¿Cuánto gasté este mes?', 'es', fechaReferencia)).toBeNull();
  });

  it('reconoce nombres de mes en inglés', () => {
    const resultado = detectarMesEnTexto('How much did I spend in June?', 'en', fechaReferencia);
    expect(resultado).not.toBeNull();
    expect(resultado?.inicio.startsWith('2026-06')).toBe(true);
  });
});
