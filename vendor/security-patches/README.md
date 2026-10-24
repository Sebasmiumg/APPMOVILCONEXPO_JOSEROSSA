# Parches locales de dependencias

Estas copias parten de las publicaciones oficiales y conservan su licencia. Se usan mediante `overrides` de npm para cerrar avisos de seguridad que todavía no tenían una versión corregida publicada al auditar el proyecto.

- `braces` 3.0.4: límite de 64 niveles de llaves antes de construir el AST, para impedir desbordamiento de pila por patrones anidados. El código base es 3.0.3.
- `node-forge` 1.4.1: exige que `DigestAlgorithm` contenga únicamente el OID y el NULL opcional, además de validar la estructura externa. Incluye el vector de regresión público de [CVE-2026-85393 y PR 1152](https://github.com/digitalbazaar/forge/pull/1152). El código base es 1.4.0.
- `sprintf-js` 1.1.4: valida los rangos de precisión para formatos numéricos, limita el ancho del campo a 10 000 y el formato a 10 000 caracteres. El código base es 1.1.3.

Los paquetes `node-forge` y `sprintf-js` excluyen sus bundles minificados precompilados para impedir que se importe una copia antigua sin los parches. La aplicación consume sus puntos de entrada JavaScript normales; no se encontraron importaciones internas de esos bundles.

Las pruebas del proyecto ejercitan los tres límites y el vector RSA de falsificación. Cuando los mantenedores publiquen versiones con estas correcciones, actualizar las dependencias y retirar estas copias locales.
