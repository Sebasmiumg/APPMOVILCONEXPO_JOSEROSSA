import { tieneAccesoCapacitaciones } from '@/src/utilidades/accesoCapacitaciones';

describe('acceso a Capacitaciones', () => {
  it.each(['ana.lopez@example.com', 'ANA.LOPEZ@example.com', ' ana.lopez@example.com '])(
    'permite a Ana con variaciones de mayúsculas y espacios: %s',
    (correo) => expect(tieneAccesoCapacitaciones(correo)).toBe(true)
  );

  it.each(['jose.cayetano@example.com', 'JOSE.CAYETANO@example.com', ' jose.cayetano@example.com '])(
    'permite a José con variaciones de mayúsculas y espacios: %s',
    (correo) => expect(tieneAccesoCapacitaciones(correo)).toBe(true)
  );

  it.each([
    'qa.cobertura01@example.com',
    'qa.cobertura02@example.com',
    'qa.cobertura03@example.com',
    'qa.cobertura04@example.com',
    'qa.cobertura05@example.com',
    'jrossac@miumg.edu.gt',
    'otra.persona@example.com',
    null,
    undefined,
  ])('deniega Capacitaciones a cuentas no autorizadas: %s', (correo) => {
    expect(tieneAccesoCapacitaciones(correo)).toBe(false);
  });
});
