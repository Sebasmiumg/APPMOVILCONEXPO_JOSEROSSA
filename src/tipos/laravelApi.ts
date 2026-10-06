export interface UsuarioAPI {
  id: number;
  name: string;
  email: string;
}

export interface RespuestaLoginAPI {
  usuario: UsuarioAPI;
  token: string;
}

export type TipoMovimientoAPI = 'ingreso' | 'gasto';

export interface MovimientoAPI {
  id: number;
  descripcion: string;
  monto: string;
  tipo: TipoMovimientoAPI;
  categoria: string;
  cuenta: string;
  fecha: string;
  created_at: string;
  updated_at: string;
}

export interface DatosMovimientoAPI {
  descripcion: string;
  monto: number;
  tipo: TipoMovimientoAPI;
  categoria: string;
  cuenta: string;
  fecha: string;
}

export interface ReporteMensualAPI {
  periodo: string;
  total_ingresos: number;
  total_gastos: number;
  saldo_neto: number;
  cantidad_movimientos: number;
}

export type EstadoPresupuestoCapacitacion = 'planificada' | 'en_curso' | 'finalizada' | 'cancelada';

export interface PresupuestoCapacitacionAPI {
  id: number;
  nombre: string;
  descripcion: string | null;
  monto_asignado: string;
  monto_ejecutado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoPresupuestoCapacitacion;
  created_at: string;
  updated_at: string;
}

export interface DatosPresupuestoCapacitacionAPI {
  nombre: string;
  descripcion?: string;
  monto_asignado: number;
  fecha_inicio: string;
  fecha_fin?: string;
  estado?: EstadoPresupuestoCapacitacion;
}

export interface CuentaAPI {
  id: number;
  nombre: string;
  tipo: string;
  moneda: string;
  saldo_inicial: string;
  color: string | null;
  icono: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatosCuentaAPI {
  nombre: string;
  tipo: string;
  moneda?: string;
  saldo_inicial?: number;
  color?: string;
  icono?: string;
  activa?: boolean;
}

export type TipoCategoriaAPI = 'ingreso' | 'gasto';

export interface CategoriaAPI {
  id: number;
  tipo: TipoCategoriaAPI;
  nombre: string;
  icono: string;
  color: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatosCategoriaAPI {
  tipo: TipoCategoriaAPI;
  nombre: string;
  icono: string;
  color: string;
  activa?: boolean;
}

export interface AporteMetaAPI {
  id: number;
  meta_id: number;
  monto: string;
  fecha: string;
  nota: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatosAporteMetaAPI {
  monto: number;
  fecha: string;
  nota?: string;
}

export type EstadoMetaAPI = 'activa' | 'completada' | 'archivada';

export interface MetaAPI {
  id: number;
  cuenta_id: number | null;
  nombre: string;
  monto_objetivo: string;
  monto_actual: string;
  fecha_objetivo: string | null;
  estado: EstadoMetaAPI;
  created_at: string;
  updated_at: string;
  aportes?: AporteMetaAPI[];
}

export interface DatosMetaAPI {
  cuenta_id?: number;
  nombre: string;
  monto_objetivo: number;
  monto_actual?: number;
  fecha_objetivo?: string;
  estado?: EstadoMetaAPI;
}

export interface PresupuestoCategoriaAPI {
  id: number;
  categoria_id: number;
  periodo: string;
  limite: string;
  porcentaje_alerta: number;
  created_at: string;
  updated_at: string;
}

export interface DatosPresupuestoCategoriaAPI {
  categoria_id: number;
  periodo: string;
  limite: number;
  porcentaje_alerta?: number;
}
