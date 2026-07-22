import type { TFunction } from 'i18next';

import { generarRespuesta, type ContextoAsistente } from '@/src/servicios/asistente/generadorRespuestas';
import es from '@/src/idiomas/es.json';
import type { Categoria } from '@/src/tipos/categoria';
import type { Meta } from '@/src/tipos/meta';
import type { Movimiento } from '@/src/tipos/movimiento';

// Traductor real (usa las cadenas de es.json e interpola {{variables}}) para verificar
// tanto el cálculo como el texto final, sin depender de react-i18next en las pruebas.
function buscarClave(clave: string): string {
  const valor = clave.split('.').reduce<unknown>((nodo, parte) => {
    if (nodo && typeof nodo === 'object' && parte in nodo) {
      return (nodo as Record<string, unknown>)[parte];
    }
    return undefined;
  }, es);
  return typeof valor === 'string' ? valor : clave;
}

function tDePruebaImpl(clave: string, variables?: Record<string, unknown>): string {
  let resultado = buscarClave(clave);
  if (variables) {
    for (const [nombre, valor] of Object.entries(variables)) {
      resultado = resultado.replace(`{{${nombre}}}`, String(valor));
    }
  }
  return resultado;
}
const tDePrueba = tDePruebaImpl as unknown as TFunction;

function crearMovimiento(parciales: Partial<Movimiento> = {}): Movimiento {
  return {
    id: 'mov-1',
    cuentaId: 'cuenta-1',
    cuentaDestinoId: null,
    movimientoRelacionadoId: null,
    tipo: 'gasto',
    monto: 100,
    categoriaId: 'cat-alimentacion',
    descripcion: null,
    notas: null,
    fechaMovimiento: new Date().toISOString(),
    comprobanteUrl: null,
    recurrente: false,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    ...parciales,
  };
}

function crearCategoria(parciales: Partial<Categoria> = {}): Categoria {
  return {
    id: 'cat-alimentacion',
    tipo: 'gasto',
    claveTraduccion: 'alimentacion',
    nombrePersonalizado: null,
    icono: 'restaurant',
    color: '#7C4DFF',
    activa: true,
    ...parciales,
  };
}

function crearMeta(parciales: Partial<Meta> = {}): Meta {
  return {
    id: 'meta-1',
    cuentaId: null,
    nombre: 'Computadora',
    montoObjetivo: 1000,
    montoActual: 250,
    fechaObjetivo: null,
    estado: 'activa',
    creadaEn: new Date().toISOString(),
    ...parciales,
  };
}

function crearContexto(parciales: Partial<ContextoAsistente> = {}): ContextoAsistente {
  return {
    movimientos: [],
    categorias: [crearCategoria()],
    cuentas: [],
    metas: [],
    moneda: 'GTQ',
    idioma: 'es',
    ...parciales,
  };
}

describe('generarRespuesta', () => {
  it('calcula el gasto del periodo con datos reales', () => {
    const contexto = crearContexto({ movimientos: [crearMovimiento({ monto: 250 })] });
    const respuesta = generarRespuesta({ tipo: 'gastoPeriodo', rango: null }, contexto, tDePrueba);
    expect(respuesta.texto).toContain('250');
  });

  it('identifica la categoría con mayor gasto usando datos reales', () => {
    const contexto = crearContexto({
      movimientos: [
        crearMovimiento({ id: 'a', categoriaId: 'cat-alimentacion', monto: 400 }),
        crearMovimiento({ id: 'b', categoriaId: 'cat-transporte', monto: 50 }),
      ],
      categorias: [crearCategoria({ id: 'cat-alimentacion' }), crearCategoria({ id: 'cat-transporte', claveTraduccion: 'transporte' })],
    });
    const respuesta = generarRespuesta({ tipo: 'categoriaMayorGasto' }, contexto, tDePrueba);
    expect(respuesta.texto).toContain('400');
  });

  it('informa cuando no hay metas activas', () => {
    const contexto = crearContexto({ metas: [] });
    const respuesta = generarRespuesta({ tipo: 'progresoMeta' }, contexto, tDePrueba);
    expect(respuesta.texto).toBe('Aún no has creado ninguna meta de ahorro.');
  });

  it('calcula el progreso de una única meta activa', () => {
    const contexto = crearContexto({ metas: [crearMeta({ montoObjetivo: 1000, montoActual: 250 })] });
    const respuesta = generarRespuesta({ tipo: 'progresoMeta' }, contexto, tDePrueba);
    expect(respuesta.texto).toContain('25');
  });

  it('lista los últimos movimientos solicitados', () => {
    const contexto = crearContexto({
      movimientos: [
        crearMovimiento({ id: 'a', monto: 50, descripcion: 'Café' }),
        crearMovimiento({ id: 'b', monto: 30, descripcion: 'Bus' }),
      ],
    });
    const respuesta = generarRespuesta({ tipo: 'ultimosMovimientos', cantidad: 2 }, contexto, tDePrueba);
    expect(respuesta.texto).toContain('Café');
    expect(respuesta.texto).toContain('Bus');
  });

  it('retorna el mensaje de no entendido para intenciones desconocidas', () => {
    const respuesta = generarRespuesta({ tipo: 'noEntendido' }, crearContexto(), tDePrueba);
    expect(respuesta.texto).toBe('No entendí tu pregunta. Prueba con alguna de las sugeridas o sé más específico.');
  });
});
