import type { TFunction } from 'i18next';
import { z } from 'zod';

const TIENE_MAYUSCULA = /[A-Z]/;
const TIENE_MINUSCULA = /[a-z]/;
const TIENE_NUMERO = /[0-9]/;
const TIENE_SIMBOLO = /[^A-Za-z0-9]/;

export function crearEsquemaRegistro(t: TFunction) {
  return z
    .object({
      nombreCompleto: z.string().min(1, t('validaciones.campoRequerido')),
      correo: z.string().min(1, t('validaciones.campoRequerido')).email(t('validaciones.correoInvalido')),
      contrasena: z
        .string()
        .min(8, t('validaciones.contrasenaCorta'))
        .refine(
          (valor) =>
            TIENE_MAYUSCULA.test(valor) &&
            TIENE_MINUSCULA.test(valor) &&
            TIENE_NUMERO.test(valor) &&
            TIENE_SIMBOLO.test(valor),
          { message: t('validaciones.contrasenaDebil') }
        ),
      confirmarContrasena: z.string(),
      aceptoTerminos: z.boolean(),
    })
    .refine((datos) => datos.contrasena === datos.confirmarContrasena, {
      path: ['confirmarContrasena'],
      message: t('validaciones.confirmacionNoCoincide'),
    })
    .refine((datos) => datos.aceptoTerminos === true, {
      path: ['aceptoTerminos'],
      message: t('validaciones.debesAceptarTerminos'),
    });
}

export type DatosRegistro = z.infer<ReturnType<typeof crearEsquemaRegistro>>;

export function crearEsquemaInicioSesion(t: TFunction) {
  return z.object({
    correo: z.string().min(1, t('validaciones.campoRequerido')).email(t('validaciones.correoInvalido')),
    contrasena: z.string().min(1, t('validaciones.campoRequerido')),
  });
}

export type DatosInicioSesion = z.infer<ReturnType<typeof crearEsquemaInicioSesion>>;

export function crearEsquemaRecuperarContrasena(t: TFunction) {
  return z.object({
    correo: z.string().min(1, t('validaciones.campoRequerido')).email(t('validaciones.correoInvalido')),
  });
}

export type DatosRecuperarContrasena = z.infer<ReturnType<typeof crearEsquemaRecuperarContrasena>>;
