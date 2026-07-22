import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface FilaMovimientoReporte {
  fecha: string;
  tipo: string;
  categoria: string;
  cuenta: string;
  descripcion: string;
  monto: string;
}

function escaparCeldaCSV(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function generarCSV(encabezados: string[], filas: FilaMovimientoReporte[]): string {
  const lineas = [
    encabezados.map(escaparCeldaCSV).join(','),
    ...filas.map((fila) =>
      [fila.fecha, fila.tipo, fila.categoria, fila.cuenta, fila.descripcion, fila.monto]
        .map(escaparCeldaCSV)
        .join(',')
    ),
  ];
  return lineas.join('\n');
}

// La API de clases File/Directory de expo-file-system solo tiene implementación nativa
// (iOS/Android); en Web se dispara una descarga estándar del navegador en su lugar.
export async function compartirArchivoTexto(contenido: string, nombreArchivo: string, mimeType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([contenido], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
    return;
  }

  const archivo = new File(Paths.cache, nombreArchivo);
  if (archivo.exists) archivo.delete();
  archivo.create();
  archivo.write(contenido);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(archivo.uri, { mimeType, dialogTitle: nombreArchivo });
  }
}

export async function exportarYCompartirPDF(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'MiPresupuesto.pdf' });
  }
}

export function generarHTMLReporte(opciones: {
  titulo: string;
  periodo: string;
  filasResumen: { etiqueta: string; valor: string }[];
  encabezadosTabla: string[];
  filas: FilaMovimientoReporte[];
}): string {
  const filasResumenHTML = opciones.filasResumen
    .map((fila) => `<tr><td>${fila.etiqueta}</td><td style="text-align:right">${fila.valor}</td></tr>`)
    .join('');

  const filasTablaHTML = opciones.filas
    .map(
      (fila) =>
        `<tr><td>${fila.fecha}</td><td>${fila.tipo}</td><td>${fila.categoria}</td><td>${fila.cuenta}</td><td>${fila.descripcion}</td><td style="text-align:right">${fila.monto}</td></tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #667085; margin-top: 0; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #E5E7EB; font-size: 12px; text-align: left; }
  th { background: #F6F7FC; }
</style>
</head>
<body>
  <h1>${opciones.titulo}</h1>
  <h2>${opciones.periodo}</h2>
  <table>${filasResumenHTML}</table>
  <table>
    <thead><tr>${opciones.encabezadosTabla.map((e) => `<th>${e}</th>`).join('')}</tr></thead>
    <tbody>${filasTablaHTML}</tbody>
  </table>
</body>
</html>`;
}
