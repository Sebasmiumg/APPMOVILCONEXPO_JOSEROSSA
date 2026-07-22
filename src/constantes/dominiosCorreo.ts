// Listas base de dominios para clasificar el correo. La clasificación es únicamente
// informativa (ver AGENTS.md §8.4) y en una fase posterior un administrador podrá
// ampliarlas desde Supabase sin requerir un cambio de código.
export const DOMINIOS_PERSONALES: readonly string[] = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'proton.me',
];

export const DOMINIOS_INSTITUCIONALES_CONOCIDOS: readonly string[] = ['miumg.edu.gt'];

export const SUFIJOS_INSTITUCIONALES: readonly string[] = ['.edu', '.edu.gt'];
