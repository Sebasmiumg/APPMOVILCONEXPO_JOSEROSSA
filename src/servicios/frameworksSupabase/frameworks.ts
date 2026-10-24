import { supabaseFrameworks } from '@/src/servicios/frameworksSupabase/cliente';
import type { DatosNuevoFramework, FrameworkAPI, LanguageAPI } from '@/src/tipos/frameworksSupabase';

export class ErrorFrameworks extends Error {
  constructor(
    public readonly codigo: 'sin_configurar' | 'sin_permiso' | 'error',
    public readonly mensajeOriginal?: string
  ) {
    super(codigo);
    this.name = 'ErrorFrameworks';
  }
}

function clienteOFalla() {
  if (!supabaseFrameworks) throw new ErrorFrameworks('sin_configurar');
  return supabaseFrameworks;
}

function envolverError(error: { code?: string; message: string }): ErrorFrameworks {
  // 42501: row-level security violation de Postgres — típicamente falta la
  // política de INSERT/UPDATE en el proyecto de Supabase del compañero.
  if (error.code === '42501') return new ErrorFrameworks('sin_permiso', error.message);
  return new ErrorFrameworks('error', error.message);
}

export async function listarLanguages(): Promise<LanguageAPI[]> {
  const cliente = clienteOFalla();
  const { data, error } = await cliente.from('languages').select('id, name, color').order('name');
  if (error) throw envolverError(error);
  return data ?? [];
}

export async function listarFrameworks(languageId?: string): Promise<FrameworkAPI[]> {
  const cliente = clienteOFalla();
  let consulta = cliente.from('frameworks').select('*, languages(name, color)').order('name');
  if (languageId) consulta = consulta.eq('language_id', languageId);
  const { data, error } = await consulta;
  if (error) throw envolverError(error);
  return (data as FrameworkAPI[]) ?? [];
}

export async function crearFramework(datos: DatosNuevoFramework): Promise<FrameworkAPI> {
  const cliente = clienteOFalla();
  const { data, error } = await cliente
    .from('frameworks')
    .insert(datos)
    .select('*, languages(name, color)')
    .single();
  if (error) throw envolverError(error);
  return data as FrameworkAPI;
}
