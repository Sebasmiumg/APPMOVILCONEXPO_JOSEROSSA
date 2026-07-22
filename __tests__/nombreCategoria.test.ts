import type { TFunction } from 'i18next';

import { nombreCategoria } from '@/src/utilidades/nombreCategoria';
import type { Categoria } from '@/src/tipos/categoria';

function crearCategoria(parciales: Partial<Categoria> = {}): Categoria {
  return {
    id: 'cat-1',
    tipo: 'gasto',
    claveTraduccion: 'alimentacion',
    nombrePersonalizado: null,
    icono: 'restaurant',
    color: '#FF0000',
    activa: true,
    ...parciales,
  };
}

const t = ((clave: string) => `traducido:${clave}`) as unknown as TFunction;

describe('nombreCategoria', () => {
  it('traduce categorías predefinidas usando tipo y claveTraduccion', () => {
    const categoria = crearCategoria({ tipo: 'gasto', claveTraduccion: 'alimentacion' });
    expect(nombreCategoria(categoria, t)).toBe('traducido:categorias.gasto.alimentacion');
  });

  it('usa el nombre personalizado cuando no hay claveTraduccion', () => {
    const categoria = crearCategoria({ claveTraduccion: null, nombrePersonalizado: 'Mi categoría' });
    expect(nombreCategoria(categoria, t)).toBe('Mi categoría');
  });

  it('cae a la etiqueta genérica cuando no hay clave ni nombre personalizado', () => {
    const categoria = crearCategoria({ claveTraduccion: null, nombrePersonalizado: null });
    expect(nombreCategoria(categoria, t)).toBe('traducido:categorias.categoriaPersonalizada');
  });
});
