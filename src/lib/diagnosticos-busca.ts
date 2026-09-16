/**
 * Busca de diagnósticos para o autocomplete do jogo.
 * Combina os temas clínicos do banco (tabela assuntos) com uma lista curada de
 * variantes específicas, e faz busca por substring inclusiva + fuzzy leve
 * (sem acentos, por palavras, tolerando ordem trocada).
 */

export const VARIANTES_DIAGNOSTICOS: string[] = [
  // Anemias
  "Anemia ferropriva",
  "Anemia megaloblástica por deficiência de B12",
  "Anemia megaloblástica por deficiência de ácido fólico",
  "Anemia perniciosa",
  "Anemia falciforme",
  "Anemia de doença crônica",
  "Anemia hemolítica autoimune",
  "Anemia aplásica",
  "Anemia sideroblástica",
  "Talassemia alfa",
  "Talassemia beta",
  "Esferocitose hereditária",
  "Deficiência de G6PD",
  // Hepatites e fígado
  "Hepatite A aguda",
  "Hepatite B aguda",
  "Hepatite B crônica",
  "Hepatite C crônica",
  "Hepatite D",
  "Hepatite E",
  "Hepatite autoimune",
  "Hepatite medicamentosa",
  "Hepatite alcoólica",
  "Esteato-hepatite não alcoólica",
  "Cirrose hepática",
  "Colangite biliar primária",
  "Colangite esclerosante primária",
  "Doença de Wilson",
  "Hemocromatose hereditária",
  "Carcinoma hepatocelular",
  // Artrites e reumatologia
  "Artrite reumatoide",
  "Artrite psoriásica",
  "Artrite reativa",
  "Artrite séptica",
  "Artrite idiopática juvenil",
  "Artrite gotosa",
  "Pseudogota (doença por pirofosfato de cálcio)",
  "Osteoartrite (artrose)",
  "Espondilite ancilosante",
  "Lúpus eritematoso sistêmico",
  "Síndrome de Sjögren",
  "Esclerose sistêmica",
  "Dermatomiosite",
  "Polimialgia reumática",
  "Arterite de células gigantes",
  "Granulomatose com poliangeíte",
  "Febre reumática",
  // Cardiologia
  "Insuficiência cardíaca com fração de ejeção reduzida",
  "Insuficiência cardíaca com fração de ejeção preservada",
  "Infarto agudo do miocárdio com supra de ST",
  "Infarto agudo do miocárdio sem supra de ST",
  "Angina estável",
  "Angina instável",
  "Pericardite aguda",
  "Endocardite infecciosa",
  "Miocardite viral",
  "Estenose aórtica",
  "Insuficiência mitral",
  "Estenose mitral",
  "Fibrilação atrial",
  "Flutter atrial",
  "Taquicardia supraventricular paroxística",
  "Bloqueio atrioventricular de 2º grau Mobitz II",
  "Dissecção aguda de aorta",
  "Hipertensão arterial secundária",
  "Cardiomiopatia hipertrófica",
  "Cardiomiopatia chagásica",
  "Tamponamento cardíaco",
  // Pneumologia
  "Pneumonia adquirida na comunidade",
  "Pneumonia hospitalar",
  "Pneumonia aspirativa",
  "Pneumonia atípica por Mycoplasma",
  "Tuberculose pulmonar",
  "Tuberculose pleural",
  "Asma brônquica",
  "Doença pulmonar obstrutiva crônica",
  "Tromboembolismo pulmonar",
  "Derrame pleural parapneumônico",
  "Empiema pleural",
  "Pneumotórax espontâneo",
  "Bronquiolite viral aguda",
  "Bronquiectasias",
  "Fibrose pulmonar idiopática",
  "Câncer de pulmão de pequenas células",
  "Câncer de pulmão não pequenas células",
  "Síndrome do desconforto respiratório agudo",
  "Apneia obstrutiva do sono",
  // Infectologia
  "Meningite bacteriana",
  "Meningite viral",
  "Meningite tuberculosa",
  "Meningite criptocócica",
  "Dengue clássica",
  "Dengue com sinais de alarme",
  "Dengue grave",
  "Zika vírus",
  "Chikungunya",
  "Febre amarela",
  "Malária por Plasmodium falciparum",
  "Malária por Plasmodium vivax",
  "Leptospirose",
  "Leishmaniose visceral",
  "Leishmaniose tegumentar",
  "Doença de Chagas aguda",
  "HIV/AIDS",
  "Sífilis primária",
  "Sífilis secundária",
  "Sífilis latente",
  "Neurossífilis",
  "Sífilis congênita",
  "Toxoplasmose cerebral",
  "Citomegalovirose",
  "Mononucleose infecciosa",
  "Endocardite por Staphylococcus aureus",
  "Erisipela",
  "Celulite bacteriana",
  "Fasciíte necrosante",
  "Herpes zóster",
  "Hanseníase virchowiana",
  "Hanseníase tuberculoide",
  "COVID-19",
  "Influenza A",
  "Sepse de foco urinário",
  // Endocrinologia
  "Diabetes mellitus tipo 1",
  "Diabetes mellitus tipo 2",
  "Diabetes gestacional",
  "Cetoacidose diabética",
  "Estado hiperglicêmico hiperosmolar",
  "Hipoglicemia por insulina",
  "Hipotireoidismo primário",
  "Hipotireoidismo subclínico",
  "Tireoidite de Hashimoto",
  "Tireoidite subaguda de De Quervain",
  "Doença de Graves",
  "Crise tireotóxica",
  "Nódulo tireoidiano benigno",
  "Carcinoma papilífero de tireoide",
  "Síndrome de Cushing",
  "Doença de Addison",
  "Hiperaldosteronismo primário",
  "Feocromocitoma",
  "Hiperparatireoidismo primário",
  "Acromegalia",
  "Prolactinoma",
  "Diabetes insipidus central",
  "Síndrome da secreção inapropriada de ADH",
  "Obesidade grau III",
  "Dislipidemia familiar",
  // Gastroenterologia
  "Doença do refluxo gastroesofágico",
  "Úlcera péptica por H. pylori",
  "Gastrite crônica atrófica",
  "Doença celíaca",
  "Doença de Crohn",
  "Retocolite ulcerativa",
  "Síndrome do intestino irritável",
  "Pancreatite aguda biliar",
  "Pancreatite crônica",
  "Colelitíase",
  "Colecistite aguda",
  "Coledocolitíase",
  "Colangite aguda",
  "Apendicite aguda",
  "Diverticulite aguda",
  "Obstrução intestinal por bridas",
  "Isquemia mesentérica aguda",
  "Hemorragia digestiva alta varicosa",
  "Hemorragia digestiva baixa",
  "Câncer colorretal",
  "Câncer gástrico",
  // Nefrologia e urologia
  "Injúria renal aguda pré-renal",
  "Necrose tubular aguda",
  "Doença renal crônica",
  "Glomerulonefrite pós-estreptocócica",
  "Nefropatia por IgA",
  "Nefropatia diabética",
  "Síndrome nefrótica",
  "Síndrome nefrítica",
  "Síndrome nefrótica por lesão mínima",
  "Glomeruloesclerose segmentar e focal",
  "Nefrolitíase",
  "Pielonefrite aguda",
  "Cistite aguda não complicada",
  "Hiperplasia prostática benigna",
  "Câncer de próstata",
  "Torção testicular",
  // Neurologia
  "Acidente vascular cerebral isquêmico",
  "Acidente vascular cerebral hemorrágico",
  "Hemorragia subaracnóidea",
  "Ataque isquêmico transitório",
  "Migrânea com aura",
  "Migrânea sem aura",
  "Cefaleia tensional",
  "Cefaleia em salvas",
  "Epilepsia focal",
  "Estado de mal epiléptico",
  "Doença de Parkinson",
  "Esclerose múltipla",
  "Síndrome de Guillain-Barré",
  "Miastenia gravis",
  "Doença de Alzheimer",
  "Demência vascular",
  "Neuropatia diabética periférica",
  "Paralisia de Bell",
  "Vertigem posicional paroxística benigna",
  // Ginecologia e obstetrícia
  "Vaginose bacteriana",
  "Candidíase vulvovaginal",
  "Tricomoníase",
  "Doença inflamatória pélvica",
  "Síndrome dos ovários policísticos",
  "Endometriose",
  "Miomatose uterina",
  "Pré-eclâmpsia",
  "Eclâmpsia",
  "Síndrome HELLP",
  "Descolamento prematuro de placenta",
  "Placenta prévia",
  "Gestação ectópica",
  "Abortamento incompleto",
  "Trabalho de parto prematuro",
  "Diabetes gestacional insulino-dependente",
  "Câncer de colo uterino",
  "Câncer de mama",
  "Mastite puerperal",
  // Pediatria
  "Bronquiolite por vírus sincicial respiratório",
  "Laringotraqueobronquite aguda (crupe)",
  "Epiglotite aguda",
  "Faringoamigdalite estreptocócica",
  "Otite média aguda",
  "Sarampo",
  "Rubéola",
  "Varicela",
  "Escarlatina",
  "Coqueluche",
  "Exantema súbito (roséola)",
  "Doença de Kawasaki",
  "Púrpura de Henoch-Schönlein",
  "Invaginação intestinal",
  "Estenose hipertrófica de piloro",
  "Icterícia neonatal fisiológica",
  "Sepse neonatal precoce",
  "Desnutrição energético-proteica",
  // Hematologia e oncologia
  "Leucemia mieloide aguda",
  "Leucemia linfoide aguda",
  "Leucemia mieloide crônica",
  "Leucemia linfocítica crônica",
  "Linfoma de Hodgkin",
  "Linfoma não Hodgkin",
  "Mieloma múltiplo",
  "Púrpura trombocitopênica imune",
  "Púrpura trombocitopênica trombótica",
  "Coagulação intravascular disseminada",
  "Trombose venosa profunda",
  "Hemofilia A",
  "Doença de von Willebrand",
  // Psiquiatria
  "Depressão maior",
  "Transtorno bipolar tipo I",
  "Transtorno de ansiedade generalizada",
  "Síndrome do pânico",
  "Esquizofrenia",
  "Transtorno obsessivo-compulsivo",
  "Anorexia nervosa",
  "Bulimia nervosa",
  "Delirium",
  "Síndrome de abstinência alcoólica",
  // Dermatologia
  "Psoríase vulgar",
  "Dermatite atópica",
  "Dermatite seborreica",
  "Pênfigo vulgar",
  "Melanoma cutâneo",
  "Carcinoma basocelular",
  "Carcinoma espinocelular",
  "Escabiose",
  "Pitiríase versicolor",
  "Urticária aguda",
  "Síndrome de Stevens-Johnson",
];

export function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Lista única de diagnósticos combinando temas do banco e variantes curadas. */
export function montarListaDiagnosticos(temasBanco: string[]) {
  const mapa = new Map<string, string>();
  for (const nome of [...VARIANTES_DIAGNOSTICOS, ...temasBanco]) {
    const limpo = nome.trim();
    if (!limpo || limpo.length < 3) continue;
    if (/^(temas gerais|m[oó]dulo|outros)/i.test(limpo)) continue;
    const chave = semAcento(limpo);
    if (!mapa.has(chave)) mapa.set(chave, limpo);
  }
  return [...mapa.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/**
 * Busca inclusiva: retorna todos os diagnósticos que contenham o termo
 * (ou todas as palavras do termo, em qualquer ordem), priorizando prefixos.
 */
export function buscarDiagnosticos(lista: string[], termo: string, limite = 40) {
  const alvo = semAcento(termo);
  if (alvo.length < 2) return [];
  const palavras = alvo.split(/\s+/).filter(Boolean);
  const pontuados: { nome: string; peso: number }[] = [];

  for (const nome of lista) {
    const chave = semAcento(nome);
    let peso = -1;
    if (chave.startsWith(alvo)) peso = 0;
    else if (chave.includes(alvo)) peso = 1;
    else if (palavras.every((p) => chave.includes(p))) peso = 2;
    else if (palavras.every((p) => p.length > 3 && fuzzy(chave, p))) peso = 3;
    if (peso >= 0) pontuados.push({ nome, peso });
  }

  return pontuados
    .sort((a, b) => a.peso - b.peso || a.nome.length - b.nome.length)
    .slice(0, limite)
    .map((p) => p.nome);
}

/** Tolerância a 1 erro de digitação por palavra (subsequência aproximada). */
function fuzzy(texto: string, palavra: string) {
  for (let i = 0; i < palavra.length; i += 1) {
    const variante = palavra.slice(0, i) + palavra.slice(i + 1);
    if (variante.length >= 3 && texto.includes(variante)) return true;
  }
  return false;
}
