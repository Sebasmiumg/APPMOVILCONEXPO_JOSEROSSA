import { supabase } from '@/src/servicios/supabase/cliente';

// Borra la cuenta completa (Auth + todos los datos) vía la Edge Function
// eliminar-cuenta, que es la única que puede llamar a auth.admin.deleteUser()
// (requiere la service_role key, que nunca puede vivir en la app — ver
// AGENTS.md §5 y §23). Todas las tablas del usuario tienen "on delete cascade"
// hacia auth.users, así que borrar el usuario de Auth basta para borrar todo
// lo demás (perfil, movimientos, metas, cuentas, categorías, presupuestos,
// recomendaciones, conversaciones, límites de IA/búsqueda) en una sola operación
// atómica, a diferencia de antes, cuando se borraba tabla por tabla desde el
// cliente y nunca se llegaba a borrar ni el perfil ni la cuenta de Auth misma
// (el usuario podía volver a iniciar sesión con las mismas credenciales).
//
// No lanza si falla: igual que cerrarSesion, el flujo de "eliminar cuenta" en
// perfil.tsx cierra sesión y redirige al usuario de todas formas, y preferimos
// eso a dejarlo atascado en la pantalla por un fallo de red al borrar.
export async function eliminarDatosUsuarioEnNube(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.functions.invoke('eliminar-cuenta', { method: 'POST' });
  } catch {
    // Ver comentario arriba: un fallo acá no debe bloquear el cierre de sesión.
  }
}
