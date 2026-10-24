import {
  generarCSV,
  generarHTMLReporte,
  type FilaMovimientoReporte,
} from '@/src/servicios/reportes/exportarReporte';

function crearFila(parciales: Partial<FilaMovimientoReporte> = {}): FilaMovimientoReporte {
  return {
    fecha: '15/10/2026',
    tipo: 'Gasto',
    categoria: 'Comida',
    cuenta: 'Efectivo',
    descripcion: 'Almuerzo',
    monto: 'Q 25.00',
    ...parciales,
  };
}

describe('exportación de reportes', () => {
  it('genera CSV con campos entrecomillados y comillas escapadas', () => {
    const csv = generarCSV(
      ['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Descripción', 'Monto'],
      [crearFila({ descripcion: 'Pago, con "comillas"\ny nota' })]
    );

    expect(csv).toBe(
      'Fecha,Tipo,Categoría,Cuenta,Descripción,Monto\n15/10/2026,Gasto,Comida,Efectivo,"Pago, con ""comillas""\ny nota",Q 25.00'
    );
  });

  it.each(['=HYPERLINK("https://ejemplo.test")', '+1+1', '-1+1', '@SUM(A1:A2)', '  =1+1', '\t=1+1', '\u00a0=1+1', '\ufeff=1+1'])(
    'neutraliza una celda CSV que empieza con una fórmula peligrosa: %s',
    (valor) => {
      const csv = generarCSV(['Descripción'], [crearFila({ descripcion: valor })]);

      expect(csv).toContain(`'${valor.replace(/"/g, '""')}`);
      expect(csv).not.toContain('\n=');
    }
  );

  it('escapa saltos de línea Windows y conserva el formato CSV', () => {
    const csv = generarCSV(['Descripción'], [crearFila({ descripcion: 'línea 1\r\nlínea 2' })]);

    expect(csv).toContain('"línea 1\r\nlínea 2"');
  });

  it('escapa contenido controlado por el usuario en todas las celdas HTML del PDF', () => {
    const html = generarHTMLReporte({
      titulo: '<script>alert("título")</script>',
      periodo: "Octubre & '26",
      filasResumen: [{ etiqueta: '<img src=x onerror=alert(1)>', valor: 'Q 10 & < 20' }],
      encabezadosTabla: ['<svg onload=alert(1)>'],
      filas: [crearFila({ descripcion: '<script>alert("movimiento")</script>' })],
    });

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<svg');
    expect(html).toContain('&lt;script&gt;alert(&quot;título&quot;)&lt;/script&gt;');
    expect(html).toContain('Octubre &amp; &#39;26');
    expect(html).toContain('Q 10 &amp; &lt; 20');
  });
});
