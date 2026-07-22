import type { NombreIcono } from '@/src/componentes/comunes/Icono';
import type { TipoCategoria } from '@/src/tipos/categoria';

export interface CategoriaSemilla {
  id: string;
  tipo: TipoCategoria;
  clave: string;
  icono: NombreIcono;
}

const PALETA_ROTATIVA: readonly string[] = [
  '#7C4DFF',
  '#4C6FFF',
  '#EC4899',
  '#20D997',
  '#F8C15C',
  '#38BDF8',
  '#FB923C',
  '#A78BFA',
];

export function colorCategoria(indice: number): string {
  return PALETA_ROTATIVA[indice % PALETA_ROTATIVA.length];
}

// Claves de traducción bajo "categorias.gasto.*" y "categorias.ingreso.*" (ver src/idiomas).
export const CATEGORIAS_GASTO_SEMILLA: readonly CategoriaSemilla[] = [
  { id: 'cat-gasto-alimentacion', tipo: 'gasto', clave: 'alimentacion', icono: 'restaurant' },
  { id: 'cat-gasto-supermercado', tipo: 'gasto', clave: 'supermercado', icono: 'local-grocery-store' },
  { id: 'cat-gasto-restaurantes', tipo: 'gasto', clave: 'restaurantes', icono: 'restaurant-menu' },
  { id: 'cat-gasto-transporte', tipo: 'gasto', clave: 'transporte', icono: 'directions-bus' },
  { id: 'cat-gasto-combustible', tipo: 'gasto', clave: 'combustible', icono: 'local-gas-station' },
  { id: 'cat-gasto-educacion', tipo: 'gasto', clave: 'educacion', icono: 'school' },
  { id: 'cat-gasto-universidad', tipo: 'gasto', clave: 'universidad', icono: 'account-balance' },
  { id: 'cat-gasto-tecnologia', tipo: 'gasto', clave: 'tecnologia', icono: 'devices' },
  { id: 'cat-gasto-salud', tipo: 'gasto', clave: 'salud', icono: 'local-hospital' },
  { id: 'cat-gasto-medicamentos', tipo: 'gasto', clave: 'medicamentos', icono: 'medical-services' },
  { id: 'cat-gasto-vivienda', tipo: 'gasto', clave: 'vivienda', icono: 'home' },
  { id: 'cat-gasto-alquiler', tipo: 'gasto', clave: 'alquiler', icono: 'vpn-key' },
  { id: 'cat-gasto-servicios', tipo: 'gasto', clave: 'servicios', icono: 'build' },
  { id: 'cat-gasto-telefonia', tipo: 'gasto', clave: 'telefonia', icono: 'phone-android' },
  { id: 'cat-gasto-internet', tipo: 'gasto', clave: 'internet', icono: 'wifi' },
  { id: 'cat-gasto-entretenimiento', tipo: 'gasto', clave: 'entretenimiento', icono: 'movie' },
  { id: 'cat-gasto-deporte', tipo: 'gasto', clave: 'deporte', icono: 'fitness-center' },
  { id: 'cat-gasto-ropa', tipo: 'gasto', clave: 'ropa', icono: 'checkroom' },
  { id: 'cat-gasto-mascotas', tipo: 'gasto', clave: 'mascotas', icono: 'pets' },
  { id: 'cat-gasto-viajes', tipo: 'gasto', clave: 'viajes', icono: 'flight' },
  { id: 'cat-gasto-deudas', tipo: 'gasto', clave: 'deudas', icono: 'credit-card' },
  { id: 'cat-gasto-impuestos', tipo: 'gasto', clave: 'impuestos', icono: 'receipt-long' },
  { id: 'cat-gasto-suscripciones', tipo: 'gasto', clave: 'suscripciones', icono: 'subscriptions' },
  { id: 'cat-gasto-regalos', tipo: 'gasto', clave: 'regalos', icono: 'card-giftcard' },
  { id: 'cat-gasto-negocio', tipo: 'gasto', clave: 'negocio', icono: 'storefront' },
  { id: 'cat-gasto-otros', tipo: 'gasto', clave: 'otros', icono: 'category' },
];

export const CATEGORIAS_INGRESO_SEMILLA: readonly CategoriaSemilla[] = [
  { id: 'cat-ingreso-salario', tipo: 'ingreso', clave: 'salario', icono: 'work' },
  { id: 'cat-ingreso-ventas', tipo: 'ingreso', clave: 'ventas', icono: 'sell' },
  { id: 'cat-ingreso-trabajoIndependiente', tipo: 'ingreso', clave: 'trabajoIndependiente', icono: 'laptop-mac' },
  { id: 'cat-ingreso-comisiones', tipo: 'ingreso', clave: 'comisiones', icono: 'percent' },
  { id: 'cat-ingreso-intereses', tipo: 'ingreso', clave: 'intereses', icono: 'account-balance' },
  { id: 'cat-ingreso-reembolsos', tipo: 'ingreso', clave: 'reembolsos', icono: 'replay' },
  { id: 'cat-ingreso-regalos', tipo: 'ingreso', clave: 'regalos', icono: 'card-giftcard' },
  { id: 'cat-ingreso-becas', tipo: 'ingreso', clave: 'becas', icono: 'school' },
  { id: 'cat-ingreso-rentas', tipo: 'ingreso', clave: 'rentas', icono: 'apartment' },
  { id: 'cat-ingreso-dividendos', tipo: 'ingreso', clave: 'dividendos', icono: 'trending-up' },
  { id: 'cat-ingreso-negocio', tipo: 'ingreso', clave: 'negocio', icono: 'storefront' },
  { id: 'cat-ingreso-otros', tipo: 'ingreso', clave: 'otros', icono: 'category' },
];

export const CATEGORIAS_SEMILLA: readonly CategoriaSemilla[] = [
  ...CATEGORIAS_GASTO_SEMILLA,
  ...CATEGORIAS_INGRESO_SEMILLA,
];
