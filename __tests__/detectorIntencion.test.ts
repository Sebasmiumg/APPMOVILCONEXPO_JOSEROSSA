import { detectarIntencion } from '@/src/servicios/asistente/detectorIntencion';

describe('detectarIntencion (español)', () => {
  it('detecta gasto del mes actual', () => {
    const resultado = detectarIntencion('¿Cuánto gasté este mes?', 'es');
    expect(resultado.tipo).toBe('gastoPeriodo');
  });

  it('detecta gasto de un mes específico y calcula el rango', () => {
    const resultado = detectarIntencion('¿Cuánto gasté en julio?', 'es');
    expect(resultado.tipo).toBe('gastoPeriodo');
    if (resultado.tipo === 'gastoPeriodo') {
      expect(resultado.rango).not.toBeNull();
      expect(resultado.rango?.inicio.startsWith('2026-07') || resultado.rango?.inicio.startsWith('2025-07')).toBe(true);
    }
  });

  it('detecta la categoría con mayor gasto', () => {
    const resultado = detectarIntencion('¿En qué categoría gasté más?', 'es');
    expect(resultado.tipo).toBe('categoriaMayorGasto');
  });

  it('detecta comparación con el mes anterior', () => {
    const resultado = detectarIntencion('¿Gasté más que el mes pasado?', 'es');
    expect(resultado.tipo).toBe('comparacionMesAnterior');
  });

  it('detecta el ahorro total', () => {
    const resultado = detectarIntencion('¿Cuánto he ahorrado?', 'es');
    expect(resultado.tipo).toBe('ahorroTotal');
  });

  it('detecta el progreso de una meta', () => {
    const resultado = detectarIntencion('¿Puedo alcanzar mi meta?', 'es');
    expect(resultado.tipo).toBe('progresoMeta');
  });

  it('detecta sugerencia de reducción de gastos', () => {
    const resultado = detectarIntencion('¿Qué gastos puedo reducir?', 'es');
    expect(resultado.tipo).toBe('sugerenciaReduccion');
  });

  it('detecta los últimos movimientos con cantidad explícita', () => {
    const resultado = detectarIntencion('Muéstrame mis últimos cinco movimientos', 'es');
    expect(resultado).toEqual({ tipo: 'ultimosMovimientos', cantidad: 5, filtroTipo: undefined });
  });

  it('detecta los últimos ingresos con filtro por tipo', () => {
    const resultado = detectarIntencion('¿Cuáles son mis últimos ingresos?', 'es');
    expect(resultado.tipo).toBe('ultimosMovimientos');
    if (resultado.tipo === 'ultimosMovimientos') {
      expect(resultado.filtroTipo).toBe('ingreso');
    }
  });

  it('usa la cantidad por defecto cuando no se especifica un número', () => {
    const resultado = detectarIntencion('Muéstrame mis últimos movimientos', 'es');
    expect(resultado.tipo).toBe('ultimosMovimientos');
    if (resultado.tipo === 'ultimosMovimientos') {
      expect(resultado.cantidad).toBe(5);
    }
  });

  it('retorna noEntendido para preguntas sin relación financiera', () => {
    const resultado = detectarIntencion('¿Qué clima hace hoy?', 'es');
    expect(resultado.tipo).toBe('noEntendido');
  });

  it('retorna noEntendido para una pregunta vacía', () => {
    expect(detectarIntencion('   ', 'es').tipo).toBe('noEntendido');
  });
});

describe('detectarIntencion (inglés)', () => {
  it('detecta gasto del mes actual en inglés', () => {
    expect(detectarIntencion('How much did I spend this month?', 'en').tipo).toBe('gastoPeriodo');
  });

  it('detecta el ahorro total en inglés', () => {
    expect(detectarIntencion('How much have I saved?', 'en').tipo).toBe('ahorroTotal');
  });

  it('detecta la categoría con mayor gasto en inglés', () => {
    expect(detectarIntencion('Which category did I spend the most on?', 'en').tipo).toBe('categoriaMayorGasto');
  });
});
