export const VERSION_ESQUEMA_ACTUAL = 4;

// Migración inicial. Los tipos monetarios usan REAL (los montos se manejan en centavos
// evitados a propósito: para el alcance local-first de esta fase se redondean a 2 decimales
// en la capa de cálculo — ver src/utilidades/calculosFinancieros.ts).
export const SQL_MIGRACION_V1 = `
CREATE TABLE IF NOT EXISTS cuentas (
  id TEXT PRIMARY KEY NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  moneda TEXT NOT NULL,
  saldo_inicial REAL NOT NULL DEFAULT 0,
  color TEXT,
  icono TEXT,
  activa INTEGER NOT NULL DEFAULT 1,
  creada_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
  id TEXT PRIMARY KEY NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  nombre_clave_traduccion TEXT,
  nombre_personalizado TEXT,
  icono TEXT NOT NULL,
  color TEXT NOT NULL,
  activa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS movimientos (
  id TEXT PRIMARY KEY NOT NULL,
  cuenta_id TEXT NOT NULL REFERENCES cuentas(id),
  cuenta_destino_id TEXT REFERENCES cuentas(id),
  movimiento_relacionado_id TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto', 'transferencia', 'ajuste')),
  monto REAL NOT NULL CHECK (monto >= 0),
  categoria_id TEXT REFERENCES categorias(id),
  descripcion TEXT,
  notas TEXT,
  fecha_movimiento TEXT NOT NULL,
  comprobante_url TEXT,
  recurrente INTEGER NOT NULL DEFAULT 0,
  creado_en TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON movimientos(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_categoria ON movimientos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias(tipo);
`;

// Presupuestos mensuales por categoría y metas de ahorro con sus aportes.
export const SQL_MIGRACION_V2 = `
CREATE TABLE IF NOT EXISTS presupuestos (
  id TEXT PRIMARY KEY NOT NULL,
  categoria_id TEXT NOT NULL REFERENCES categorias(id),
  periodo TEXT NOT NULL,
  limite REAL NOT NULL CHECK (limite >= 0),
  porcentaje_alerta INTEGER NOT NULL DEFAULT 80,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS metas (
  id TEXT PRIMARY KEY NOT NULL,
  cuenta_id TEXT REFERENCES cuentas(id),
  nombre TEXT NOT NULL,
  monto_objetivo REAL NOT NULL CHECK (monto_objetivo > 0),
  monto_actual REAL NOT NULL DEFAULT 0,
  fecha_objetivo TEXT,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'completada', 'archivada')),
  creada_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aportes_meta (
  id TEXT PRIMARY KEY NOT NULL,
  meta_id TEXT NOT NULL REFERENCES metas(id),
  monto REAL NOT NULL CHECK (monto > 0),
  fecha TEXT NOT NULL,
  nota TEXT
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_periodo ON presupuestos(periodo);
CREATE INDEX IF NOT EXISTS idx_presupuestos_categoria ON presupuestos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_aportes_meta ON aportes_meta(meta_id);
`;

// Cola de sincronización local-first (AGENTS.md §24): cada escritura local encola un
// cambio pendiente que se empuja a Supabase cuando hay sesión y conexión. También se
// añade "actualizado_en" a las tablas que aún no lo tenían, para poder resolver
// conflictos por última escritura al sincronizar.
export const SQL_MIGRACION_V3 = `
ALTER TABLE cuentas ADD COLUMN actualizado_en TEXT;
UPDATE cuentas SET actualizado_en = creada_en WHERE actualizado_en IS NULL;

ALTER TABLE categorias ADD COLUMN actualizado_en TEXT;
UPDATE categorias SET actualizado_en = datetime('now') WHERE actualizado_en IS NULL;

ALTER TABLE presupuestos ADD COLUMN actualizado_en TEXT;
UPDATE presupuestos SET actualizado_en = creado_en WHERE actualizado_en IS NULL;

ALTER TABLE metas ADD COLUMN actualizado_en TEXT;
UPDATE metas SET actualizado_en = creada_en WHERE actualizado_en IS NULL;

CREATE TABLE IF NOT EXISTS cola_sincronizacion (
  id TEXT PRIMARY KEY NOT NULL,
  tabla TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  operacion TEXT NOT NULL CHECK (operacion IN ('insertar', 'actualizar', 'eliminar')),
  payload TEXT,
  creado_en TEXT NOT NULL,
  sincronizado INTEGER NOT NULL DEFAULT 0,
  intentos INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cola_sincronizada ON cola_sincronizacion(sincronizado);
`;
