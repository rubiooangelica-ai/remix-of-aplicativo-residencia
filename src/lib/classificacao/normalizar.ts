/**
 * Normalização de texto para a classificação determinística.
 * Sem IA: só transformação de texto e expansão de abreviações.
 */

const ABREVIACOES: [RegExp, string][] = [
  [/\bhas\b/g, "hipertensao arterial sistemica"],
  [/\bicc?\b/g, "insuficiencia cardiaca"],
  [/\biam\b/g, "infarto agudo do miocardio"],
  [/\bscacsst\b/g, "sindrome coronariana aguda com supra de st"],
  [/\bdpoc\b/g, "doenca pulmonar obstrutiva cronica"],
  [/\btep\b/g, "tromboembolismo pulmonar"],
  [/\btvp\b/g, "trombose venosa profunda"],
  [/\bdrge\b/g, "doenca do refluxo gastroesofagico"],
  [/\bhda\b/g, "hemorragia digestiva alta"],
  [/\bhdb\b/g, "hemorragia digestiva baixa"],
  [/\bdrc\b/g, "doenca renal cronica"],
  [/\blra\b/g, "lesao renal aguda"],
  [/\bitu\b/g, "infeccao do trato urinario"],
  [/\bdm1\b/g, "diabetes mellitus tipo 1"],
  [/\bdm2\b/g, "diabetes mellitus tipo 2"],
  [/\bdmg\b/g, "diabetes mellitus gestacional"],
  [/\bavc\b/g, "acidente vascular cerebral"],
  [/\bavci\b/g, "acidente vascular cerebral isquemico"],
  [/\bavch\b/g, "acidente vascular cerebral hemorragico"],
  [/\bhsa\b/g, "hemorragia subaracnoidea"],
  [/\btce\b/g, "traumatismo cranioencefalico"],
  [/\batls\b/g, "trauma atls"],
  [/\bacls\b/g, "parada cardiorrespiratoria acls"],
  [/\brcp\b/g, "reanimacao cardiopulmonar"],
  [/\bsdra\b/g, "sindrome do desconforto respiratorio agudo"],
  [/\bhpb\b/g, "hiperplasia prostatica benigna"],
  [/\bsop\b/g, "sindrome dos ovarios policisticos"],
  [/\bdip\b/g, "doenca inflamatoria pelvica"],
  [/\bdheg\b/g, "doenca hipertensiva especifica da gestacao"],
  [/\bmgso4\b/g, "sulfato de magnesio"],
  [/\bdpp\b/g, "descolamento prematuro de placenta"],
  [/\brpm\b/g, "rotura prematura de membranas"],
  [/\brcf\b/g, "restricao de crescimento fetal"],
  [/\btpp\b/g, "trabalho de parto prematuro"],
  [/\bhpp\b/g, "hemorragia pos parto"],
  [/\bdtg\b/g, "doenca trofoblastica gestacional"],
  [/\bbva\b/g, "bronquiolite viral aguda"],
  [/\bivas\b/g, "infeccao de vias aereas superiores"],
  [/\bcia\b/g, "comunicacao interatrial"],
  [/\bciv\b/g, "comunicacao interventricular"],
  [/\bhiv\b/g, "hiv aids"],
  [/\bist\b/g, "infeccao sexualmente transmissivel"],
  [/\bdst\b/g, "infeccao sexualmente transmissivel"],
  [/\bsus\b/g, "sistema unico de saude"],
  [/\baps\b/g, "atencao primaria a saude"],
  [/\besf\b/g, "estrategia saude da familia"],
  [/\bubs\b/g, "unidade basica de saude"],
  [/\bpni\b/g, "programa nacional de imunizacoes"],
  [/\bhpv\b/g, "papilomavirus humano hpv"],
  [/\btgo\b/g, "transaminase"],
  [/\btgp\b/g, "transaminase"],
];

/**
 * Abreviações ambíguas: só são expandidas quando o próprio texto traz contexto
 * clínico compatível (evita, por exemplo, "DM" de dermatomiosite virar diabetes).
 */
const AMBIGUAS: [RegExp, string, RegExp][] = [
  [/\bdm\b/g, "diabetes mellitus", /glicem|glicad|insulin|metformin|diabet|glicose|hiperglic|cetoacid/],
  [/\bfa\b/g, "fibrilacao atrial", /eletrocardiograma|ecg|arritmi|palpitac|anticoagul|ritmo irregular|atrial|cardiovers/],
  [/\bvm\b/g, "ventilacao mecanica", /intuba|ventila|respirador|peep|tubo orotraqueal|oxigenio/],
  [/\bcad\b/g, "cetoacidose diabetica", /glicem|cetona|cetonuria|acidose|diabet|insulin/],
  [/\bles\b/g, "lupus eritematoso sistemico", /fan|anti dna|lupus|autoimun|malar|artralgi|artrite/],
  [/\btb\b/g, "tuberculose", /bacilo|escarro|baar|tosse|rifampicin|pulmonar|cavita/],
  [/\brn\b/g, "recem nascido", /nascid|neonat|parto|apgar|gestac|amamenta|aleitament/],
  [/\bpca\b/g, "persistencia do canal arterial", /sopro|canal arterial|cardiopat|neonat|ecocardiograma/],
  [/\bsca\b/g, "sindrome coronariana aguda", /troponina|dor toracica|eletrocardiograma|coronar|precordial/],
  [/\big\b/g, "idade gestacional", /gestac|semanas|obstetr|pre natal|parto/],
  [/\bpcr\b/g, "parada cardiorrespiratoria", /reanima|massagem cardiaca|desfibril|assistol|parada|adrenalina/],
];

/** minúsculas, sem acento, hífen e espaços normalizados, abreviações expandidas. */
export function normalizar(texto: string, contexto?: string): string {
  let t = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[-_/]/g, " ")
    .replace(/[^a-z0-9\s%.,;:?!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [re, sub] of ABREVIACOES) t = t.replace(re, sub);
  const ctx = (contexto ? `${contexto} ${t}` : t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  for (const [re, sub, pista] of AMBIGUAS) {
    if (pista.test(ctx)) t = t.replace(re, sub);
  }
  return t.replace(/\s+/g, " ").trim();
}


/** remove pontuação e plurais simples, para casar termos. */
export function palavras(texto: string): string[] {
  return texto
    .replace(/[%.,;:?!]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(singular);
}

const EXCECOES_PLURAL = new Set([
  "seis",
  "mais",
  "apos",
  "reflexos",
  "pais",
  "dois",
  "tres",
  "gases",
  "casos",
]);

export function singular(p: string): string {
  if (p.length <= 4 || EXCECOES_PLURAL.has(p)) return p;
  if (p.endsWith("oes")) return `${p.slice(0, -3)}ao`;
  if (p.endsWith("aes")) return `${p.slice(0, -3)}ao`;
  if (p.endsWith("ais")) return `${p.slice(0, -3)}al`;
  if (p.endsWith("eis")) return `${p.slice(0, -3)}el`;
  if (p.endsWith("veis")) return `${p.slice(0, -4)}vel`;
  if (p.endsWith("ns")) return `${p.slice(0, -2)}m`;
  if (p.endsWith("es") && !p.endsWith("ses")) return p.slice(0, -2);
  if (p.endsWith("s")) return p.slice(0, -1);
  return p;
}

/** chave canônica de um termo (frase ou palavra). */
export function chaveTermo(termo: string): string {
  return palavras(normalizar(termo)).join(" ");
}

/** n-gramas de 1 a 4 palavras presentes no texto. */
export function ngramas(ps: string[]): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < ps.length; i += 1) {
    let frase = ps[i]!;
    set.add(frase);
    for (let n = 1; n < 4 && i + n < ps.length; n += 1) {
      frase = `${frase} ${ps[i + n]!}`;
      set.add(frase);
    }
  }
  return set;
}
