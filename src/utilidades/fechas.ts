// Fechas "solo día" (sin hora), como fecha_objetivo de una meta: se guardan y
// se leen usando los componentes LOCALES del Date, nunca toISOString()/new
// Date(cadena). Una cadena "YYYY-MM-DD" se interpreta como medianoche UTC por
// la especificación ECMA-262, así que en cualquier zona horaria negativa
// (todas las de América, el mercado de esta app) new Date("2026-12-13") cae
// en 12 de diciembre al convertirla a hora local, mostrando un día antes del
// elegido. Estas dos funciones son la única forma correcta de convertir entre
// un Date y una cadena de fecha-solo-día en esta app.

export function formatearFechaSoloDia(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

// Tolera tanto "YYYY-MM-DD" como un timestamp ISO completo ("YYYY-MM-DDTHH:mm:ss.sssZ")
// tomando solo los primeros 10 caracteres, por si llega un valor guardado antes de
// este fix o con otro origen (ej. la API de Laravel).
export function analizarFechaSoloDia(cadena: string): Date {
  const [anio, mes, dia] = cadena.slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}
