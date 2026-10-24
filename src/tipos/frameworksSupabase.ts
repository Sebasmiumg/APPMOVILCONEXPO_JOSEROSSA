export interface LanguageAPI {
  id: string;
  name: string;
  color: string;
}

export interface FrameworkAPI {
  id: string;
  name: string;
  language_id: string;
  tagline: string | null;
  description: string | null;
  year: number | null;
  creator: string | null;
  color: string | null;
  key_features: string[];
  use_cases: string[];
  curiosity: string | null;
  docs_url: string | null;
  languages?: Pick<LanguageAPI, 'name' | 'color'> | null;
}

export interface DatosNuevoFramework {
  name: string;
  language_id: string;
  tagline?: string;
  description?: string;
  year?: number;
  creator?: string;
  color?: string;
  key_features?: string[];
  use_cases?: string[];
  curiosity?: string;
  docs_url?: string;
}
