import type { Href, ImperativeRouter } from 'expo-router';

// router.back() emite un error de consola cuando no hay pantalla previa en el historial
// (por ejemplo, al abrir una ruta modal directamente por URL o enlace profundo).
export function volverOIrA(router: ImperativeRouter, rutaAlternativa: Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(rutaAlternativa);
  }
}
