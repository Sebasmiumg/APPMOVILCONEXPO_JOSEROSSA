import { formatearMoneda } from '@/src/utilidades/formatoMoneda';

describe('formatearMoneda', () => {
  it('formatea quetzales para el idioma español', () => {
    const resultado = formatearMoneda(1234.5, 'GTQ', 'es');
    expect(resultado).toContain('1,234.50');
  });

  it('formatea dólares para el idioma inglés', () => {
    const resultado = formatearMoneda(1234.5, 'USD', 'en');
    expect(resultado).toContain('1,234.50');
    expect(resultado).toContain('$');
  });

  it('formatea el monto cero correctamente', () => {
    const resultado = formatearMoneda(0, 'GTQ', 'es');
    expect(resultado).toContain('0.00');
  });
});
