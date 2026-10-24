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
  { id: '9c7f4d00-0000-4000-8000-000000000001', tipo: 'gasto', clave: 'alimentacion', icono: 'restaurant' },
  { id: '9c7f4d00-0000-4000-8000-000000000002', tipo: 'gasto', clave: 'supermercado', icono: 'local-grocery-store' },
  { id: '9c7f4d00-0000-4000-8000-000000000003', tipo: 'gasto', clave: 'restaurantes', icono: 'restaurant-menu' },
  { id: '9c7f4d00-0000-4000-8000-000000000004', tipo: 'gasto', clave: 'transporte', icono: 'directions-bus' },
  { id: '9c7f4d00-0000-4000-8000-000000000005', tipo: 'gasto', clave: 'combustible', icono: 'local-gas-station' },
  { id: '9c7f4d00-0000-4000-8000-000000000006', tipo: 'gasto', clave: 'educacion', icono: 'school' },
  { id: '9c7f4d00-0000-4000-8000-000000000007', tipo: 'gasto', clave: 'universidad', icono: 'account-balance' },
  { id: '9c7f4d00-0000-4000-8000-000000000008', tipo: 'gasto', clave: 'tecnologia', icono: 'devices' },
  { id: '9c7f4d00-0000-4000-8000-000000000009', tipo: 'gasto', clave: 'salud', icono: 'local-hospital' },
  { id: '9c7f4d00-0000-4000-8000-000000000010', tipo: 'gasto', clave: 'medicamentos', icono: 'medical-services' },
  { id: '9c7f4d00-0000-4000-8000-000000000011', tipo: 'gasto', clave: 'vivienda', icono: 'home' },
  { id: '9c7f4d00-0000-4000-8000-000000000012', tipo: 'gasto', clave: 'alquiler', icono: 'vpn-key' },
  { id: '9c7f4d00-0000-4000-8000-000000000013', tipo: 'gasto', clave: 'servicios', icono: 'build' },
  { id: '9c7f4d00-0000-4000-8000-000000000014', tipo: 'gasto', clave: 'telefonia', icono: 'phone-android' },
  { id: '9c7f4d00-0000-4000-8000-000000000015', tipo: 'gasto', clave: 'internet', icono: 'wifi' },
  { id: '9c7f4d00-0000-4000-8000-000000000016', tipo: 'gasto', clave: 'entretenimiento', icono: 'movie' },
  { id: '9c7f4d00-0000-4000-8000-000000000017', tipo: 'gasto', clave: 'deporte', icono: 'fitness-center' },
  { id: '9c7f4d00-0000-4000-8000-000000000018', tipo: 'gasto', clave: 'ropa', icono: 'checkroom' },
  { id: '9c7f4d00-0000-4000-8000-000000000019', tipo: 'gasto', clave: 'mascotas', icono: 'pets' },
  { id: '9c7f4d00-0000-4000-8000-000000000020', tipo: 'gasto', clave: 'viajes', icono: 'flight' },
  { id: '9c7f4d00-0000-4000-8000-000000000021', tipo: 'gasto', clave: 'deudas', icono: 'credit-card' },
  { id: '9c7f4d00-0000-4000-8000-000000000022', tipo: 'gasto', clave: 'impuestos', icono: 'receipt-long' },
  { id: '9c7f4d00-0000-4000-8000-000000000023', tipo: 'gasto', clave: 'suscripciones', icono: 'subscriptions' },
  { id: '9c7f4d00-0000-4000-8000-000000000024', tipo: 'gasto', clave: 'regalos', icono: 'card-giftcard' },
  { id: '9c7f4d00-0000-4000-8000-000000000025', tipo: 'gasto', clave: 'negocio', icono: 'storefront' },
  { id: '9c7f4d00-0000-4000-8000-000000000026', tipo: 'gasto', clave: 'otros', icono: 'category' },
];

export const CATEGORIAS_INGRESO_SEMILLA: readonly CategoriaSemilla[] = [
  { id: '9c7f4d00-0000-4000-8000-000000000027', tipo: 'ingreso', clave: 'salario', icono: 'work' },
  { id: '9c7f4d00-0000-4000-8000-000000000028', tipo: 'ingreso', clave: 'ventas', icono: 'sell' },
  { id: '9c7f4d00-0000-4000-8000-000000000029', tipo: 'ingreso', clave: 'trabajoIndependiente', icono: 'laptop-mac' },
  { id: '9c7f4d00-0000-4000-8000-000000000030', tipo: 'ingreso', clave: 'comisiones', icono: 'percent' },
  { id: '9c7f4d00-0000-4000-8000-000000000031', tipo: 'ingreso', clave: 'intereses', icono: 'account-balance' },
  { id: '9c7f4d00-0000-4000-8000-000000000032', tipo: 'ingreso', clave: 'reembolsos', icono: 'replay' },
  { id: '9c7f4d00-0000-4000-8000-000000000033', tipo: 'ingreso', clave: 'regalos', icono: 'card-giftcard' },
  { id: '9c7f4d00-0000-4000-8000-000000000034', tipo: 'ingreso', clave: 'becas', icono: 'school' },
  { id: '9c7f4d00-0000-4000-8000-000000000035', tipo: 'ingreso', clave: 'rentas', icono: 'apartment' },
  { id: '9c7f4d00-0000-4000-8000-000000000036', tipo: 'ingreso', clave: 'dividendos', icono: 'trending-up' },
  { id: '9c7f4d00-0000-4000-8000-000000000037', tipo: 'ingreso', clave: 'negocio', icono: 'storefront' },
  { id: '9c7f4d00-0000-4000-8000-000000000038', tipo: 'ingreso', clave: 'otros', icono: 'category' },
];

export const CATEGORIAS_SEMILLA: readonly CategoriaSemilla[] = [
  ...CATEGORIAS_GASTO_SEMILLA,
  ...CATEGORIAS_INGRESO_SEMILLA,
];
