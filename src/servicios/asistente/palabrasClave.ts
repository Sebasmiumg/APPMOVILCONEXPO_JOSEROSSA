import type { CodigoIdioma } from '@/src/idiomas/configuracionIdioma';

interface DiccionarioIdioma {
  gasto: string[];
  ingreso: string[];
  categoria: string[];
  mayor: string[];
  reducir: string[];
  ahorro: string[];
  meta: string[];
  puedo: string[];
  ultimos: string[];
  movimientos: string[];
  esteMes: string[];
  mesPasado: string[];
  compararMas: string[];
  compararMenos: string[];
}

export const PALABRAS_CLAVE: Record<CodigoIdioma, DiccionarioIdioma> = {
  es: {
    gasto: ['gasté', 'gaste', 'gasto', 'gastos', 'gastando'],
    ingreso: ['ingreso', 'ingresos', 'gané', 'gane'],
    categoria: ['categoría', 'categoria'],
    mayor: ['más', 'mas', 'mayor', 'mayores'],
    reducir: ['reducir', 'recortar', 'bajar', 'disminuir'],
    ahorro: ['ahorrado', 'ahorro', 'ahorros'],
    meta: ['meta', 'metas', 'objetivo'],
    puedo: ['puedo', 'alcanzar', 'lograr', 'cumplir'],
    ultimos: ['últimos', 'ultimos', 'última', 'ultima', 'recientes'],
    movimientos: ['movimientos', 'movimiento', 'transacciones'],
    esteMes: ['este mes', 'del mes', 'mes actual'],
    mesPasado: ['mes pasado', 'mes anterior'],
    compararMas: ['más que', 'mas que', 'más qué'],
    compararMenos: ['menos que'],
  },
  en: {
    gasto: ['spent', 'spend', 'spending', 'expenses', 'expense'],
    ingreso: ['income', 'earned', 'earnings'],
    categoria: ['category'],
    mayor: ['most', 'highest', 'more'],
    reducir: ['reduce', 'cut', 'lower', 'decrease'],
    ahorro: ['saved', 'savings'],
    meta: ['goal', 'goals'],
    puedo: ['can i', 'achieve', 'reach', 'meet'],
    ultimos: ['last', 'recent', 'latest'],
    movimientos: ['transactions', 'movements'],
    esteMes: ['this month'],
    mesPasado: ['last month', 'previous month'],
    compararMas: ['more than'],
    compararMenos: ['less than'],
  },
  zh: {
    gasto: ['花费', '花了', '支出', '消费'],
    ingreso: ['收入', '赚了'],
    categoria: ['分类', '类别'],
    mayor: ['最多', '最高'],
    reducir: ['减少', '削减', '降低'],
    ahorro: ['储蓄', '存了', '存款'],
    meta: ['目标'],
    puedo: ['能否', '能不能', '可以'],
    ultimos: ['最近', '最后'],
    movimientos: ['记录', '交易'],
    esteMes: ['这个月', '本月'],
    mesPasado: ['上个月', '上月'],
    compararMas: ['比', '更多'],
    compararMenos: ['更少'],
  },
  hi: {
    gasto: ['खर्च', 'खर्चा'],
    ingreso: ['आय', 'कमाया'],
    categoria: ['श्रेणी'],
    mayor: ['सबसे अधिक', 'ज्यादा'],
    reducir: ['कम करूं', 'घटाऊं', 'कम'],
    ahorro: ['बचत', 'बचाया'],
    meta: ['लक्ष्य'],
    puedo: ['क्या मैं', 'हासिल'],
    ultimos: ['आखिरी', 'हाल के', 'पिछले'],
    movimientos: ['लेन-देन'],
    esteMes: ['इस महीने'],
    mesPasado: ['पिछले महीने'],
    compararMas: ['से ज्यादा', 'से अधिक'],
    compararMenos: ['से कम'],
  },
  ar: {
    gasto: ['أنفقت', 'إنفاق', 'المصروفات', 'مصروف'],
    ingreso: ['دخل', 'كسبت'],
    categoria: ['فئة'],
    mayor: ['الأكثر', 'أكثر'],
    reducir: ['تقليل', 'خفض', 'أقلل'],
    ahorro: ['ادخرت', 'ادخار'],
    meta: ['هدف'],
    puedo: ['هل يمكنني', 'تحقيق'],
    ultimos: ['آخر', 'أحدث'],
    movimientos: ['حركات', 'معاملات'],
    esteMes: ['هذا الشهر'],
    mesPasado: ['الشهر الماضي'],
    compararMas: ['أكثر من'],
    compararMenos: ['أقل من'],
  },
};

const NUMEROS_PALABRA: Record<string, number> = {
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function extraerNumero(texto: string): number | null {
  const coincidenciaDigito = texto.match(/\d+/);
  if (coincidenciaDigito) return Number.parseInt(coincidenciaDigito[0], 10);

  const textoNormalizado = texto.toLowerCase();
  for (const [palabra, valor] of Object.entries(NUMEROS_PALABRA)) {
    if (textoNormalizado.includes(palabra)) return valor;
  }
  return null;
}

function contieneAlguna(texto: string, palabras: string[]): boolean {
  const normalizado = texto.toLowerCase();
  return palabras.some((palabra) => normalizado.includes(palabra));
}

export function contienePalabraClave(
  texto: string,
  idioma: CodigoIdioma,
  clave: keyof DiccionarioIdioma
): boolean {
  return contieneAlguna(texto, PALABRAS_CLAVE[idioma][clave]);
}
