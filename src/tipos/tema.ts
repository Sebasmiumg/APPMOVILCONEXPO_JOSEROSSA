export type ModoTema = 'claro' | 'oscuro';

export interface PaletaColores {
  fondoPrincipal: string;
  fondoSecundario: string;
  tarjeta: string;
  tarjetaElevada: string;
  borde: string;
  textoPrincipal: string;
  textoSecundario: string;
  violeta: string;
  azul: string;
  rosa: string;
  ingreso: string;
  gasto: string;
  advertencia: string;
  sobrePrimario: string;
}

export interface Tema {
  modo: ModoTema;
  colores: PaletaColores;
  gradientePrincipal: [string, string, string];
  radios: {
    tarjeta: number;
    boton: number;
    chip: number;
  };
  espaciado: (multiplo: number) => number;
  alturaControlMinima: number;
}
