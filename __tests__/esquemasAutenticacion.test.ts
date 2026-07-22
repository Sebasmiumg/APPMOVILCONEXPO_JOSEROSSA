import type { TFunction } from 'i18next';

import {
  crearEsquemaInicioSesion,
  crearEsquemaRecuperarContrasena,
  crearEsquemaRegistro,
} from '@/src/validaciones/esquemasAutenticacion';
import es from '@/src/idiomas/es.json';

function buscarClave(objeto: unknown, ruta: string): string {
  const valor = ruta.split('.').reduce<unknown>((actual, parte) => {
    if (actual && typeof actual === 'object') return (actual as Record<string, unknown>)[parte];
    return undefined;
  }, objeto);
  return typeof valor === 'string' ? valor : ruta;
}

const t = ((clave: string) => buscarClave(es, clave)) as unknown as TFunction;

describe('crearEsquemaRegistro', () => {
  const esquema = crearEsquemaRegistro(t);
  const datosValidos = {
    nombreCompleto: 'Ana López',
    correo: 'ana@example.com',
    contrasena: 'Segura1!',
    confirmarContrasena: 'Segura1!',
    aceptoTerminos: true,
  };

  it('acepta datos válidos', () => {
    expect(esquema.safeParse(datosValidos).success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const resultado = esquema.safeParse({ ...datosValidos, nombreCompleto: '' });
    expect(resultado.success).toBe(false);
  });

  it('rechaza correo con formato inválido', () => {
    const resultado = esquema.safeParse({ ...datosValidos, correo: 'no-es-un-correo' });
    expect(resultado.success).toBe(false);
  });

  it('rechaza contraseña de menos de 8 caracteres', () => {
    const resultado = esquema.safeParse({ ...datosValidos, contrasena: 'Ab1!', confirmarContrasena: 'Ab1!' });
    expect(resultado.success).toBe(false);
  });

  it.each([
    ['sin mayúscula', 'segura1!'],
    ['sin minúscula', 'SEGURA1!'],
    ['sin número', 'Segurano!'],
    ['sin símbolo', 'Segura123'],
  ])('rechaza contraseña %s', (_descripcion, contrasena) => {
    const resultado = esquema.safeParse({ ...datosValidos, contrasena, confirmarContrasena: contrasena });
    expect(resultado.success).toBe(false);
  });

  it('rechaza cuando la confirmación no coincide', () => {
    const resultado = esquema.safeParse({ ...datosValidos, confirmarContrasena: 'Otra12345!' });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path.includes('confirmarContrasena'))).toBe(true);
    }
  });

  it('rechaza cuando no se aceptan los términos', () => {
    const resultado = esquema.safeParse({ ...datosValidos, aceptoTerminos: false });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues.some((i) => i.path.includes('aceptoTerminos'))).toBe(true);
    }
  });
});

describe('crearEsquemaInicioSesion', () => {
  const esquema = crearEsquemaInicioSesion(t);

  it('acepta correo y contraseña presentes', () => {
    expect(esquema.safeParse({ correo: 'ana@example.com', contrasena: 'cualquiera' }).success).toBe(true);
  });

  it('rechaza correo inválido', () => {
    expect(esquema.safeParse({ correo: 'invalido', contrasena: 'cualquiera' }).success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    expect(esquema.safeParse({ correo: 'ana@example.com', contrasena: '' }).success).toBe(false);
  });
});

describe('crearEsquemaRecuperarContrasena', () => {
  const esquema = crearEsquemaRecuperarContrasena(t);

  it('acepta un correo válido', () => {
    expect(esquema.safeParse({ correo: 'ana@example.com' }).success).toBe(true);
  });

  it('rechaza un correo vacío', () => {
    expect(esquema.safeParse({ correo: '' }).success).toBe(false);
  });
});
