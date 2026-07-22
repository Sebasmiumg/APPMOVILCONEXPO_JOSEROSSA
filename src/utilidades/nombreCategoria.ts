import type { TFunction } from 'i18next';

import type { Categoria } from '@/src/tipos/categoria';

export function nombreCategoria(categoria: Categoria, t: TFunction): string {
  if (categoria.claveTraduccion) {
    return t(`categorias.${categoria.tipo}.${categoria.claveTraduccion}`);
  }
  return categoria.nombrePersonalizado ?? t('categorias.categoriaPersonalizada');
}
