import { supabase } from '@/src/servicios/supabase/cliente';

// Borra los datos financieros del usuario en Supabase (no la cuenta de autenticación:
// eso requiere una llamada con la service_role key, que solo puede vivir en una Edge
// Function — ver AGENTS.md §5 y §23. Aun así, esto deja al usuario sin ningún dato
// personal en la nube y cierra su sesión).
export async function eliminarDatosUsuarioEnNube(usuarioId: string): Promise<void> {
  if (!supabase) return;

  await supabase.from('movimientos').delete().eq('usuario_id', usuarioId);
  await supabase.from('presupuestos').delete().eq('usuario_id', usuarioId);
  await supabase.from('metas').delete().eq('usuario_id', usuarioId);
  await supabase.from('categorias').delete().eq('usuario_id', usuarioId);
  await supabase.from('cuentas').delete().eq('usuario_id', usuarioId);
  await supabase.from('recomendaciones').delete().eq('usuario_id', usuarioId);
  await supabase.from('conversaciones').delete().eq('usuario_id', usuarioId);
}
