export type TipoCategoria = 'ingreso' | 'gasto';

export interface Categoria {
  id: string;
  tipo: TipoCategoria;
  claveTraduccion: string | null;
  nombrePersonalizado: string | null;
  icono: string;
  color: string;
  activa: boolean;
}

export interface FilaCategoriaSQL {
  id: string;
  tipo: string;
  nombre_clave_traduccion: string | null;
  nombre_personalizado: string | null;
  icono: string;
  color: string;
  activa: number;
}

export function mapearFilaCategoria(fila: FilaCategoriaSQL): Categoria {
  return {
    id: fila.id,
    tipo: fila.tipo as TipoCategoria,
    claveTraduccion: fila.nombre_clave_traduccion,
    nombrePersonalizado: fila.nombre_personalizado,
    icono: fila.icono,
    color: fila.color,
    activa: fila.activa === 1,
  };
}
