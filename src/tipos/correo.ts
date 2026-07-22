export type TipoCorreo = 'personal' | 'institucional' | 'organizacional';

export interface ClasificacionCorreo {
  tipo: TipoCorreo;
  dominio: string;
}
