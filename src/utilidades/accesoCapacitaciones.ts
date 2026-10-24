const CORREOS_AUTORIZADOS = new Set(['ana.lopez@example.com', 'jose.cayetano@example.com']);

export function tieneAccesoCapacitaciones(correo?: string | null): boolean {
  return typeof correo === 'string' && CORREOS_AUTORIZADOS.has(correo.trim().toLowerCase());
}
