/**
 * Dicionário curado de palavras-chave por assunto da taxonomia oficial.
 *
 * Chave: nome do assunto OU caminho completo "Área>Tema>Assunto"
 * (use o caminho quando o mesmo nome existir em áreas diferentes).
 *
 * Pesos aplicados pelo classificador:
 *  fortes    +10  expressão altamente específica
 *  nome       +8  nome da doença/condição
 *  criterios  +6  critério diagnóstico / achado muito característico
 *  drogas     +5  tratamento/medicamento/procedimento característico
 *  achados    +3  sintoma ou achado relacionado
 *  negativos  -7  termo que aponta para outro diagnóstico
 */
export type Entrada = {
  fortes?: string[];
  nome?: string[];
  criterios?: string[];
  drogas?: string[];
  achados?: string[];
  negativos?: string[];
};

export const DICIONARIO: Record<string, Entrada> = {
  // ---------------- Clínica Médica > Cardiologia ----------------
  "Hipertensão Arterial Sistêmica": {
    fortes: ["hipertensao arterial sistemica", "hipertensao estagio", "crise hipertensiva", "urgencia hipertensiva", "emergencia hipertensiva", "mapa monitorizacao ambulatorial da pressao arterial", "hipertensao resistente", "hipertensao do avental branco"],
    criterios: ["pressao arterial de 160", "pressao arterial de 180", "pa 180", "pa 160 100", "meta pressorica"],
    drogas: ["losartana", "enalapril", "anlodipino", "hidroclorotiazida", "clortalidona", "captopril", "nitroprussiato"],
    achados: ["pressao arterial elevada", "hipertenso"],
    negativos: ["gestante", "gestacao", "20 semanas", "proteinuria"],
  },
  "Insuficiência Cardíaca": {
    fortes: ["insuficiencia cardiaca", "fracao de ejecao reduzida", "insuficiencia cardiaca descompensada", "edema agudo de pulmao", "nyha", "cardiomiopatia dilatada com insuficiencia"],
    criterios: ["bnp", "nt probnp", "turgencia jugular", "estertores bibasais", "b3", "ortopneia", "dispneia paroxistica noturna", "congestao pulmonar"],
    drogas: ["sacubitril", "valsartana sacubitril", "dapagliflozina", "espironolactona", "carvedilol", "furosemida", "digoxina"],
    achados: ["edema de membros inferiores", "hepatomegalia dolorosa"],
  },
  "Síndrome Coronariana Aguda": {
    fortes: ["sindrome coronariana aguda", "infarto agudo do miocardio", "supradesnivelamento do segmento st", "supra de st", "angina instavel", "infarto sem supra", "trombolise no infarto", "angioplastia primaria", "killip"],
    criterios: ["troponina elevada", "curva de troponina", "dor toracica em aperto", "dor precordial irradiada", "eletrocardiograma com supra", "infradesnivelamento de st"],
    drogas: ["aspirina clopidogrel", "ticagrelor", "tenecteplase", "alteplase", "dupla antiagregacao"],
    achados: ["dor toracica", "sudorese fria"],
  },
  "DAC Crônica e Prevenção Secundária": {
    fortes: ["angina estavel", "doenca arterial coronariana cronica", "teste ergometrico para isquemia", "cintilografia miocardica", "revascularizacao eletiva", "prevencao secundaria cardiovascular"],
    achados: ["dor toracica ao esforco", "melhora com repouso"],
  },
  Taquiarritmias: {
    fortes: ["fibrilacao atrial", "flutter atrial", "taquicardia supraventricular", "taquicardia ventricular", "cha2ds2 vasc", "chads", "cardioversao", "taquicardia com qrs largo", "wolff parkinson white"],
    criterios: ["ritmo irregular sem onda p", "frequencia cardiaca de 160", "palpitacao com pulso irregular"],
    drogas: ["amiodarona", "adenosina", "varfarina", "rivaroxabana", "anticoagulacao oral", "verapamil", "metoprolol endovenoso"],
  },
  "Bradiarritmias e Bloqueios AV": {
    fortes: ["bloqueio atrioventricular", "bloqueio av total", "bloqueio de segundo grau mobitz", "doenca do no sinusal", "marcapasso definitivo", "bradicardia sintomatica"],
    drogas: ["atropina", "marcapasso transcutaneo"],
    criterios: ["frequencia cardiaca de 38", "dissociacao atrioventricular"],
  },
  Valvopatias: {
    fortes: ["estenose aortica", "insuficiencia mitral", "estenose mitral", "insuficiencia aortica", "prolapso de valva mitral", "troca valvar", "febre reumatica com valvopatia"],
    criterios: ["sopro sistolico em foco aortico", "sopro diastolico", "estalido de abertura", "sopro rude irradiado para carotidas"],
  },
  Cardiomiopatias: {
    fortes: ["cardiomiopatia hipertrofica", "cardiomiopatia dilatada", "cardiomiopatia restritiva", "miocardiopatia chagasica", "displasia arritmogenica"],
    criterios: ["hipertrofia septal assimetrica", "morte subita em atleta jovem"],
  },
  "Endocardite Infecciosa": {
    fortes: ["endocardite infecciosa", "criterios de duke", "vegetacao valvar"],
    criterios: ["hemocultura positiva com sopro novo", "manchas de janeway", "nodulos de osler", "febre e sopro novo"],
    drogas: ["oxacilina e gentamicina", "profilaxia de endocardite"],
  },
  Pericardiopatias: {
    fortes: ["pericardite aguda", "tamponamento cardiaco", "derrame pericardico", "pericardite constritiva", "sinal de kussmaul", "pulso paradoxal"],
    criterios: ["atrito pericardico", "dor toracica que melhora ao inclinar para frente", "supra difuso de st com depressao de pr"],
  },
  "Dislipidemia e Risco Cardiovascular": {
    fortes: ["dislipidemia", "ldl colesterol alvo", "escore de risco cardiovascular", "hipercolesterolemia familiar", "hipertrigliceridemia"],
    drogas: ["estatina", "atorvastatina", "sinvastatina", "ezetimiba", "fibrato"],
  },
  "Síndromes Aórticas Agudas": {
    fortes: ["disseccao de aorta", "sindrome aortica aguda", "aneurisma de aorta roto", "hematoma intramural aortico", "stanford tipo a"],
    criterios: ["dor toracica lancinante irradiada para o dorso", "assimetria de pulsos", "diferenca de pressao entre os bracos", "alargamento do mediastino"],
  },

  // ---------------- Clínica Médica > Pneumologia ----------------
  Asma: {
    fortes: ["asma", "crise asmatica", "asma de difícil controle", "controle da asma", "espirometria com resposta ao broncodilatador"],
    drogas: ["budesonida formoterol", "corticoide inalatorio", "salbutamol", "beta2 agonista de longa duracao"],
    criterios: ["sibilancia recorrente", "variabilidade do pico de fluxo", "vef1 com reversibilidade"],
    negativos: ["lactente", "primeiro episodio de sibilancia"],
  },
  DPOC: {
    fortes: ["doenca pulmonar obstrutiva cronica", "exacerbacao de doenca pulmonar obstrutiva cronica", "gold", "enfisema pulmonar", "bronquite cronica", "cor pulmonale"],
    criterios: ["tabagista de longa data com dispneia", "vef1 cvf menor que 0 7", "obstrucao nao reversivel"],
    drogas: ["tiotropio", "oxigenoterapia domiciliar prolongada"],
  },
  Pneumonias: {
    fortes: ["pneumonia adquirida na comunidade", "pneumonia hospitalar", "curb 65", "pneumonia associada a ventilacao", "broncopneumonia", "pneumonia aspirativa"],
    criterios: ["consolidacao no radiograma de torax", "tosse produtiva com febre", "crepitacao localizada", "broncofonia"],
    drogas: ["amoxicilina clavulanato", "azitromicina", "ceftriaxona e claritromicina", "levofloxacino"],
  },
  "Tuberculose Pulmonar": {
    fortes: ["tuberculose pulmonar", "baciloscopia de escarro", "teste rapido molecular para tuberculose", "cavitacao em apice pulmonar", "esquema rip", "rifampicina isoniazida pirazinamida etambutol"],
    criterios: ["tosse por mais de tres semanas", "sudorese noturna e perda de peso", "bacilo alcool acido resistente"],
  },
  "Derrame Pleural e Pneumotórax": {
    fortes: ["derrame pleural", "pneumotorax", "criterios de light", "toracocentese", "drenagem toracica em selo dagua", "empiema pleural", "pneumotorax hipertensivo"],
    criterios: ["macicez a percussao com abolicao do murmurio", "hipertimpanismo", "desvio de traqueia"],
  },
  "Tromboembolismo Pulmonar": {
    fortes: ["tromboembolismo pulmonar", "embolia pulmonar", "escore de wells", "angiotomografia de torax para embolia", "d dimero"],
    criterios: ["dispneia subita com dor pleuritica", "taquicardia e hipoxemia subita", "s1q3t3"],
    drogas: ["enoxaparina", "heparina de baixo peso"],
  },
  "Pneumopatias Intersticiais": {
    fortes: ["fibrose pulmonar idiopatica", "pneumopatia intersticial", "pneumonite de hipersensibilidade", "sarcoidose pulmonar", "faveolamento", "vidro fosco difuso"],
    criterios: ["estertores em velcro", "baqueteamento digital", "padrao restritivo na espirometria"],
  },
  SAHOS: {
    fortes: ["apneia obstrutiva do sono", "polissonografia", "indice de apneia e hipopneia", "cpap para apneia", "epworth"],
    achados: ["ronco e sonolencia diurna"],
  },
  "Câncer de Pulmão": {
    fortes: ["cancer de pulmao", "neoplasia pulmonar", "adenocarcinoma de pulmao", "carcinoma de pequenas celulas", "nodulo pulmonar solitario", "rastreamento com tomografia de baixa dose"],
    criterios: ["massa pulmonar em tabagista", "sindrome de pancoast", "derrame pleural neoplasico"],
  },

  // ---------------- Clínica Médica > Gastroenterologia ----------------
  "Doença do Refluxo Gastroesofágico": {
    fortes: ["doenca do refluxo gastroesofagico", "esofago de barrett", "phmetria esofagica", "esofagite erosiva los angeles"],
    drogas: ["omeprazol", "inibidor de bomba de protons"],
    achados: ["pirose", "regurgitacao"],
  },
  "Doença Ulcerosa Péptica": {
    fortes: ["ulcera peptica", "ulcera duodenal", "ulcera gastrica", "helicobacter pylori", "erradicacao do h pylori", "ulcera perfurada"],
    criterios: ["dor epigastrica que melhora com alimentacao", "pneumoperitonio"],
  },
  "Doenças Inflamatórias Intestinais": {
    fortes: ["doenca de crohn", "retocolite ulcerativa", "doenca inflamatoria intestinal", "calprotectina fecal", "pedras de calcamento", "fistula perianal em crohn"],
    drogas: ["mesalazina", "infliximabe", "azatioprina"],
    criterios: ["diarreia com sangue e muco cronica", "acometimento salteado do ileo"],
  },
  "Diarreia e Síndromes Disabsortivas": {
    fortes: ["sindrome disabsortiva", "diarreia cronica", "esteatorreia", "supercrescimento bacteriano", "insuficiencia pancreatica exocrina"],
    criterios: ["perda ponderal com evacuacoes gordurosas"],
    negativos: ["crianca", "lactente", "desidratacao aguda"],
  },
  "Hemorragia Digestiva": {
    fortes: ["hemorragia digestiva alta", "hemorragia digestiva baixa", "hematemese", "melena", "varizes esofagicas sangrantes", "forrest", "enterorragia"],
    drogas: ["terlipressina", "ligadura elastica", "esclerose endoscopica", "octreotide"],
    criterios: ["endoscopia digestiva alta de urgencia"],
  },
  "Pancreatite e Vias Biliares": {
    fortes: ["pancreatite aguda", "pancreatite cronica", "criterios de atlanta", "colangite aguda", "triade de charcot", "coledocolitiase", "colangiopancreatografia retrograda"],
    criterios: ["amilase e lipase elevadas", "dor em faixa irradiada para o dorso", "sinal de cullen", "sinal de grey turner"],
  },
  "Cirrose e Complicações": {
    fortes: ["cirrose hepatica", "child pugh", "meld", "ascite", "peritonite bacteriana espontanea", "encefalopatia hepatica", "sindrome hepatorrenal", "hipertensao portal"],
    criterios: ["gradiente de albumina soro ascite", "asterixe", "circulacao colateral abdominal"],
    drogas: ["lactulose", "espironolactona e furosemida para ascite", "paracentese", "propranolol profilaxia"],
  },
  "Hepatites Virais": {
    fortes: ["hepatite a", "hepatite b", "hepatite c", "anti hbs", "hbsag", "anti hbc", "hbeag", "carga viral do hcv", "hepatite viral aguda"],
    drogas: ["tenofovir para hepatite", "antiviral de acao direta"],
    criterios: ["icterícia com transaminase muito elevada", "transaminase acima de 1000"],
  },
  "Doença Celíaca": {
    fortes: ["doenca celiaca", "antitransglutaminase", "atrofia de vilosidades", "dieta sem gluten", "gluten"],
  },

  // ---------------- Clínica Médica > Nefrologia ----------------
  Glomerulopatias: {
    fortes: ["sindrome nefrotica", "sindrome nefritica", "glomerulonefrite", "glomeruloesclerose segmentar e focal", "nefropatia por iga", "doenca de lesao minima", "nefrite lupica", "glomerulonefrite pos estreptococica"],
    criterios: ["proteinuria maciça", "hematuria dismorfica", "cilindros hematicos", "edema periorbitario com proteinuria"],
  },
  "Injúria Renal Aguda": {
    fortes: ["injuria renal aguda", "lesao renal aguda", "necrose tubular aguda", "kdigo", "nefrite intersticial aguda", "indicacao de dialise de urgencia"],
    criterios: ["elevacao da creatinina em 48 horas", "oliguria com aumento de ureia", "fracao de excrecao de sodio"],
  },
  "Doença Renal Crônica": {
    fortes: ["doenca renal cronica", "taxa de filtracao glomerular estagio", "dialise cronica", "hemodialise de manutencao", "osteodistrofia renal", "transplante renal"],
    criterios: ["clearance de creatinina reduzido por mais de tres meses", "anemia da doenca renal"],
  },
  "Distúrbios Hidroeletrolíticos": {
    fortes: ["hiponatremia", "hipernatremia", "hipercalemia", "hipocalemia", "hipercalcemia", "hipomagnesemia", "hipofosfatemia", "sindrome de desmielinizacao osmotica"],
    drogas: ["gluconato de calcio", "solucao salina hipertonica", "insulina e glicose para potassio"],
    criterios: ["sodio de 118", "potassio de 7", "onda t apiculada"],
  },
  "Distúrbios Ácido-Base": {
    fortes: ["acidose metabolica", "alcalose metabolica", "acidose respiratoria", "alcalose respiratoria", "anion gap", "gasometria arterial com ph"],
    criterios: ["ph 7 1", "bicarbonato de 8", "acidose com anion gap elevado"],
  },
  "Infecção Urinária e Nefrolitíase": {
    fortes: ["pielonefrite", "cistite aguda", "bacteriuria assintomatica", "nefrolitiase", "calculo renal", "urocultura"],
    drogas: ["nitrofurantoina", "fosfomicina", "ciprofloxacino para itu"],
    negativos: ["gestante", "gestacao"],
  },
  "Hipertensão e Rim": {
    fortes: ["nefroesclerose hipertensiva", "estenose de arteria renal", "hipertensao secundaria renal", "hiperaldosteronismo com hipertensao"],
  },

  // ---------------- Clínica Médica > Endocrinologia ----------------
  "Diabetes Mellitus": {
    fortes: ["diabetes mellitus tipo 2", "hemoglobina glicada", "cetoacidose diabetica", "estado hiperglicemico hiperosmolar", "pe diabetico", "retinopatia diabetica", "nefropatia diabetica", "rastreamento de diabetes"],
    drogas: ["metformina", "empagliflozina", "liraglutida", "insulina nph", "insulina basal bolus", "gliclazida"],
    criterios: ["glicemia de jejum de 126", "teste oral de tolerancia a glicose", "polidipsia e poliuria"],
    negativos: ["gestante", "gestacao", "diabetes gestacional", "crianca"],
  },
  "Doenças da Tireoide": {
    fortes: ["hipotireoidismo", "hipertireoidismo", "doenca de graves", "tireoidite de hashimoto", "nodulo de tireoide", "cancer de tireoide", "tireotoxicose", "crise tireotoxica", "bocio"],
    criterios: ["tsh suprimido", "tsh elevado com t4 livre baixo", "anti tpo", "captacao de iodo radioativo"],
    drogas: ["levotiroxina", "metimazol", "propiltiouracil"],
    negativos: ["gestante", "gestacao"],
  },
  "Obesidade e Síndrome Metabólica": {
    fortes: ["sindrome metabolica", "circunferencia abdominal aumentada com trigliceride", "indice de massa corporal de 3"],
    achados: ["obesidade", "sobrepeso"],
  },
  "Distúrbios das Adrenais": {
    fortes: ["sindrome de cushing", "insuficiencia adrenal", "doenca de addison", "feocromocitoma", "hiperaldosteronismo primario", "incidentaloma adrenal", "crise adrenal"],
    criterios: ["cortisol salivar", "teste de supressao com dexametasona", "metanefrinas urinarias", "hiperpigmentacao com hiponatremia"],
  },
  "Distúrbios Hipofisários": {
    fortes: ["prolactinoma", "acromegalia", "diabetes insipidus", "hipopituitarismo", "adenoma hipofisario", "apoplexia hipofisaria", "sindrome de sheehan"],
    criterios: ["hiperprolactinemia", "igf 1 elevado", "hemianopsia bitemporal"],
  },
  "Osteoporose e Metabolismo Ósseo": {
    fortes: ["osteoporose", "densitometria ossea", "t score", "hiperparatireoidismo", "doenca de paget ossea", "fratura por fragilidade"],
    drogas: ["alendronato", "bisfosfonato", "denosumabe"],
  },

  // ---------------- Clínica Médica > Hematologia ----------------
  Anemias: {
    fortes: ["anemia ferropriva", "anemia megaloblastica", "anemia hemolitica", "anemia de doenca cronica", "talassemia", "deficiencia de b12", "esferocitose", "anemia aplasica"],
    criterios: ["vcm baixo com ferritina baixa", "reticulocitos elevados", "coombs direto", "ferro serico e saturacao de transferrina"],
    negativos: ["anemia falciforme"],
  },
  "Distúrbios da Hemostasia e Coagulação": {
    fortes: ["hemofilia", "doenca de von willebrand", "coagulacao intravascular disseminada", "trombofilia", "sindrome antifosfolipide", "alargamento do ttpa"],
    criterios: ["inr alargado", "hemartrose de repeticao"],
  },
  "Distúrbios Plaquetários": {
    fortes: ["plaquetopenia", "purpura trombocitopenica imune", "purpura trombocitopenica trombotica", "trombocitopenia induzida por heparina", "plaquetas de 10 000"],
    achados: ["petequias", "equimose espontanea"],
  },
  "Leucemias e Linfomas": {
    fortes: ["leucemia mieloide aguda", "leucemia linfoide aguda", "leucemia mieloide cronica", "leucemia linfocitica cronica", "linfoma de hodgkin", "linfoma nao hodgkin", "mieloma multiplo", "blastos no sangue periferico", "cromossomo philadelphia"],
    criterios: ["linfonodomegalia indolor com sudorese noturna", "celulas de reed sternberg", "hipercalcemia com lesoes liticas"],
  },
  "Transfusão Sanguínea": {
    fortes: ["transfusao de concentrado de hemacias", "reacao transfusional", "hemocomponente", "plasma fresco congelado", "transfusao macica", "trali"],
  },

  // ---------------- Clínica Médica > Infectologia ----------------
  "HIV/Aids": {
    fortes: ["hiv aids", "carga viral do hiv", "contagem de cd4", "terapia antirretroviral", "profilaxia pos exposicao ao hiv", "profilaxia pre exposicao", "pneumocistose", "neurotoxoplasmose", "sindrome inflamatoria de reconstituicao imune"],
    drogas: ["dolutegravir", "tenofovir lamivudina dolutegravir", "sulfametoxazol trimetoprim profilatico"],
  },
  Tuberculose: {
    fortes: ["tuberculose extrapulmonar", "tuberculose latente", "prova tuberculinica", "tratamento diretamente observado", "tuberculose ganglionar", "tuberculose pleural", "tuberculose meningea", "contatos de tuberculose"],
  },
  Arboviroses: {
    fortes: ["dengue", "chikungunya", "zika", "febre amarela", "sinais de alarme da dengue", "prova do laco", "dengue grave", "ns1"],
    criterios: ["plaquetopenia com hemoconcentracao", "exantema apos febre com mialgia"],
    negativos: ["gestante", "crianca", "lactente"],
  },
  "Sepse e Infecções Graves": {
    fortes: ["sepse", "choque septico", "qsofa", "sofa", "lactato elevado com hipotensao", "bundle de sepse", "foco infeccioso com disfuncao organica"],
    drogas: ["noradrenalina", "antibiotico na primeira hora"],
  },
  "Antimicrobianos e Uso Racional": {
    fortes: ["uso racional de antimicrobianos", "resistencia bacteriana", "espectro do antibiotico", "descalonamento de antibiotico", "esbl", "carbapenemase", "stewardship"],
  },
  "Meningites e Infecções do SNC": {
    fortes: ["meningite bacteriana", "meningite meningococica", "liquor com pleocitose", "meningococcemia", "quimioprofilaxia de meningite"],
    criterios: ["rigidez de nuca com febre", "sinal de kernig", "sinal de brudzinski", "punção lombar com liquor turvo"],
  },
  "Doenças Negligenciadas e Parasitoses": {
    fortes: ["esquistossomose", "doenca de chagas", "leishmaniose visceral", "leishmaniose tegumentar", "malaria", "leptospirose", "toxoplasmose adquirida", "ancilostomiase", "estrongiloidiase", "teniase e cisticercose"],
    drogas: ["praziquantel", "benznidazol", "glucantime", "artesunato"],
  },
  "Clínica Médica>Infectologia>Infecções Sexualmente Transmissíveis": {
    fortes: ["sifilis adquirida", "vdrl com titulo", "cancro duro", "gonorreia", "uretrite gonococica", "cancro mole", "linfogranuloma venereo", "herpes genital", "condiloma acuminado"],
    drogas: ["penicilina benzatina", "ceftriaxona e azitromicina para uretrite"],
    negativos: ["gestante", "gestacao"],
  },
  "Mononucleose Infecciosa": {
    fortes: ["mononucleose infecciosa", "epstein barr", "linfocitose atipica com faringite", "exantema apos amoxicilina"],
  },

  // ---------------- Clínica Médica > Reumatologia ----------------
  "Artrite Reumatoide": {
    fortes: ["artrite reumatoide", "fator reumatoide", "anti ccp", "rigidez matinal prolongada", "erosao articular simetrica"],
    drogas: ["metotrexato", "leflunomida", "anti tnf"],
    criterios: ["poliartrite simetrica de pequenas articulacoes"],
  },
  "Clínica Médica>Reumatologia>Lúpus Eritematoso Sistêmico": {
    fortes: ["lupus eritematoso sistemico", "fan", "anti dna nativo", "anti sm", "rash malar", "nefrite lupica", "criterios slicc"],
    drogas: ["hidroxicloroquina", "pulso de metilprednisolona", "ciclofosfamida"],
    negativos: ["gestante", "gestacao"],
  },
  Espondiloartrites: {
    fortes: ["espondilite ancilosante", "artrite psoriasica", "hla b27", "sacroileite", "artrite reativa", "lombalgia inflamatoria", "entesite", "dactilite"],
  },
  Vasculites: {
    fortes: ["granulomatose com poliangeite", "arterite de takayasu", "arterite temporal", "poliarterite nodosa", "purpura de henoch schonlein", "anca", "doenca de kawasaki com vasculite", "doenca de behcet"],
    criterios: ["cefaleia temporal com claudicacao de mandibula", "purpura palpavel com hemorragia alveolar"],
  },
  "Artrite por Cristais": {
    fortes: ["gota", "artrite gotosa", "pseudogota", "condrocalcinose", "cristais de urato monossodico", "hiperuricemia com monoartrite", "tofo gotoso", "podagra"],
    drogas: ["colchicina", "alopurinol"],
  },
  "Fibromialgia e Síndromes Dolorosas": {
    fortes: ["fibromialgia", "dor difusa cronica com pontos dolorosos", "sindrome miofascial"],
  },
  Osteoartrite: {
    fortes: ["osteoartrite", "artrose", "osteofito", "gonartrose", "coxartrose", "reducao do espaco articular com esclerose"],
  },

  // ---------------- Clínica Médica > Neurologia ----------------
  "Acidente Vascular Cerebral": {
    fortes: ["acidente vascular cerebral isquemico", "acidente vascular cerebral hemorragico", "trombolise com alteplase", "janela terapeutica de 4 5 horas", "nihss", "ataque isquemico transitorio", "trombectomia mecanica", "hemorragia subaracnoidea"],
    criterios: ["hemiparesia de inicio subito", "desvio de rima com deficit motor subito", "afasia subita"],
  },
  Cefaleias: {
    fortes: ["migranea", "enxaqueca", "cefaleia em salvas", "cefaleia tensional", "aura visual", "cefaleia em trovoada", "hipertensao intracraniana idiopatica"],
    drogas: ["sumatriptano", "topiramato para profilaxia", "propranolol para profilaxia de migranea"],
  },
  "Epilepsia e Crises Convulsivas": {
    fortes: ["epilepsia", "crise tonico clonica generalizada", "estado de mal epileptico", "crise focal", "eletroencefalograma com atividade epileptiforme"],
    drogas: ["fenitoina", "carbamazepina", "acido valproico", "levetiracetam", "diazepam endovenoso"],
    negativos: ["crianca", "lactente", "convulsao febril"],
  },
  "Clínica Médica>Neurologia>Infecções do Sistema Nervoso Central": {
    fortes: ["encefalite herpetica", "abscesso cerebral", "neurocisticercose", "meningoencefalite"],
    drogas: ["aciclovir endovenoso"],
  },
  "Distúrbios do Movimento e Demências": {
    fortes: ["doenca de parkinson", "parkinsonismo", "tremor essencial", "doenca de alzheimer", "demencia frontotemporal", "demencia vascular", "coreia de huntington", "bradicinesia com rigidez"],
    drogas: ["levodopa", "donepezila", "memantina"],
  },
  "Neuropatias e Doenças Neuromusculares": {
    fortes: ["polineuropatia periferica", "sindrome de guillain barre", "miastenia gravis", "esclerose lateral amiotrofica", "sindrome do tunel do carpo", "paralisia facial periferica", "neuropatia diabetica dolorosa"],
    criterios: ["fraqueza ascendente com arreflexia", "fatigabilidade com ptose"],
  },
  "Doenças Desmielinizantes": {
    fortes: ["esclerose multipla", "neuromielite optica", "neurite optica com lesoes desmielinizantes", "bandas oligoclonais", "surto desmielinizante"],
  },

  // ---------------- Clínica Médica > Dermatologia ----------------
  "Dermatoses Infecciosas": {
    fortes: ["erisipela", "celulite cutanea", "impetigo", "escabiose", "pediculose", "tinha", "dermatofitose", "candidiase cutanea", "herpes zoster", "molusco contagioso cutaneo", "paracoccidioidomicose cutanea", "esporotricose"],
  },
  "Dermatoses Inflamatórias e Eczemas": {
    fortes: ["dermatite atopica", "dermatite seborreica", "dermatite de contato", "eczema", "liquen plano", "pitiriase rosea"],
  },
  "Neoplasias Cutâneas": {
    fortes: ["melanoma", "carcinoma basocelular", "carcinoma espinocelular", "regra do abcde", "ceratose actinica", "dermatoscopia de lesao pigmentada", "indice de breslow"],
  },
  Hanseníase: {
    fortes: ["hansenaise", "hanseniase", "mycobacterium leprae", "baciloscopia de linfa", "mancha hipocromica com hipoestesia", "reacao hansenica", "poliquimioterapia para hanseniase", "espessamento neural"],
  },
  Psoríase: {
    fortes: ["psoriase", "placa eritematodescamativa com escama prateada", "sinal de auspitz", "psoriase em placas", "onicopatia psoriasica"],
  },
  Farmacodermias: {
    fortes: ["sindrome de stevens johnson", "necrolise epidermica toxica", "dress", "exantema medicamentoso", "sinal de nikolsky", "farmacodermia"],
  },

  // ---------------- Clínica Médica > Psiquiatria ----------------
  "Transtornos do Humor": {
    fortes: ["depressao maior", "episodio depressivo", "transtorno bipolar", "episodio de mania", "distimia", "risco de suicidio com humor deprimido"],
    drogas: ["sertralina", "fluoxetina", "litio", "quetiapina para humor", "escitalopram"],
  },
  "Transtornos de Ansiedade": {
    nome: ["transtorno de panico", "transtorno do panico", "transtorno de ansiedade", "crise de ansiedade", "agorafobia"],
    criterios: ["sensacao de morte iminente", "medo de morrer", "medo de novos episodios", "evitacao fobica", "sintomas autonomicos recorrentes"],
    fortes: ["transtorno de ansiedade generalizada", "sindrome do panico", "ataque de panico", "fobia social", "transtorno obsessivo compulsivo", "transtorno de estresse pos traumatico"],
  },
  "Esquizofrenia e Transtornos Psicóticos": {
    fortes: ["esquizofrenia", "delirio persecutorio com alucinacao auditiva", "sintomas negativos", "primeiro episodio psicotico", "transtorno delirante"],
    drogas: ["haloperidol", "risperidona", "clozapina", "antipsicotico atipico"],
  },
  "Transtornos por Uso de Substâncias": {
    fortes: ["sindrome de abstinencia alcoolica", "delirium tremens", "dependencia de alcool", "uso de crack", "dependencia de cocaina", "sindrome de wernicke", "cage", "audit"],
    drogas: ["tiamina", "naltrexona", "dissulfiram"],
  },
  "Emergências Psiquiátricas": {
    fortes: ["agitacao psicomotora", "contencao mecanica", "tentativa de suicidio no pronto socorro", "sindrome neuroleptica maligna", "sindrome serotoninergica"],
  },

  // ---------------- Clínica Médica > Oncologia Clínica ----------------
  "Princípios de Oncologia": {
    fortes: ["estadiamento tnm", "quimioterapia neoadjuvante", "quimioterapia adjuvante", "cuidado oncologico multidisciplinar", "toxicidade da quimioterapia", "neutropenia febril"],
  },
  "Clínica Médica>Oncologia Clínica>Câncer de Mama": {
    fortes: ["cancer de mama metastatico", "receptor hormonal e her2", "tamoxifeno", "trastuzumabe", "quimioterapia adjuvante para cancer de mama"],
  },
  "Clínica Médica>Oncologia Clínica>Câncer Colorretal": {
    fortes: ["cancer colorretal metastatico", "cea no seguimento", "quimioterapia folfox", "rastreamento com colonoscopia"],
  },
  "Câncer de Próstata": {
    fortes: ["cancer de prostata", "psa elevado", "escore de gleason", "toque retal com nodulo endurecido", "biopsia prostatica", "bloqueio hormonal para prostata"],
  },
  "Emergências Oncológicas": {
    fortes: ["sindrome de lise tumoral", "compressao medular neoplasica", "sindrome da veia cava superior", "hipercalcemia da malignidade", "neutropenia febril grave"],
  },

  // ---------------- Clínica Médica > Geriatria / Paliativos / Nutrologia ----------------
  "Síndromes Geriátricas": {
    fortes: ["sindrome geriatrica", "fragilidade no idoso", "quedas recorrentes no idoso", "incontinencia no idoso", "imobilidade no idoso", "iatrogenia no idoso"],
  },
  "Delirium e Demência": {
    fortes: ["delirium", "confusao mental aguda flutuante", "cam confusion assessment", "declinio cognitivo com demencia", "miniexame do estado mental"],
  },
  Polifarmácia: {
    fortes: ["polifarmacia", "criterios de beers", "desprescricao", "cascata iatrogenica", "medicamento potencialmente inapropriado para idoso"],
  },
  "Sarcopenia e Nutrição no Idoso": {
    fortes: ["sarcopenia", "forca de preensao palmar reduzida", "risco nutricional no idoso", "mini nutritional assessment"],
  },
  "Avaliação Geriátrica Ampla": {
    fortes: ["avaliacao geriatrica ampla", "atividades basicas de vida diaria", "escala de katz", "escala de lawton", "timed up and go"],
  },
  "Cuidados no Fim de Vida": {
    fortes: ["cuidados de fim de vida", "ortotanasia", "distanasia", "diretivas antecipadas de vontade", "sedacao paliativa", "suspensao de suporte artificial"],
  },
  "Comunicação de Más Notícias": {
    fortes: ["comunicacao de mas noticias", "protocolo spikes", "conspiracao do silencio"],
  },
  "Manejo de Sintomas Paliativos": {
    fortes: ["dispneia refrataria em paliativo", "escada analgesica da oms", "rotacao de opioide", "controle de sintomas em cuidados paliativos", "morfina para dispneia"],
  },
  "Clínica Médica>Nutrologia>Obesidade": {
    fortes: ["tratamento farmacologico da obesidade", "obesidade grau iii", "indicacao de cirurgia bariatrica por imc", "semaglutida para obesidade"],
  },
  "Desnutrição e Suporte Nutricional": {
    fortes: ["nutricao enteral", "nutricao parenteral", "sindrome de realimentacao", "desnutricao proteico calorica", "kwashiorkor", "marasmo"],
  },
  "Deficiências Vitamínicas e Minerais": {
    fortes: ["deficiencia de vitamina a", "deficiencia de vitamina d", "escorbuto", "pelagra", "beriberi", "deficiencia de zinco", "deficiencia de iodo"],
  },
  "Distúrbios Alimentares": {
    fortes: ["anorexia nervosa", "bulimia", "transtorno de compulsao alimentar"],
  },

  // ---------------- Clínica Médica > Alergia, ORL, Oftalmo, Dor ----------------
  "Rinite e Urticária Alérgicas": {
    fortes: ["rinite alergica", "urticaria", "angioedema", "dermatite alergica com prurido", "teste cutaneo de puntura"],
    drogas: ["anti histaminico", "loratadina", "corticoide nasal"],
  },
  Anafilaxia: {
    fortes: ["anafilaxia", "choque anafilatico", "adrenalina intramuscular", "reacao alergica grave com hipotensao"],
  },
  "Imunodeficiências Primárias": {
    fortes: ["imunodeficiencia primaria", "agamaglobulinemia", "deficiencia de iga", "infeccoes de repeticao com imunodeficiencia", "imunodeficiencia comum variavel"],
  },
  Faringotonsilites: {
    fortes: ["faringoamigdalite estreptococica", "escore de centor", "abscesso periamigdaliano", "amigdalite bacteriana", "exsudato amigdaliano com adenomegalia"],
  },
  Rinossinusite: {
    fortes: ["rinossinusite aguda", "sinusite bacteriana", "dor facial com secrecao purulenta", "rinossinusite cronica com polipo"],
  },
  Vertigem: {
    fortes: ["vertigem posicional paroxistica benigna", "doenca de meniere", "neurite vestibular", "manobra de dix hallpike", "manobra de epley", "nistagmo com vertigem"],
  },
  "Olho Vermelho": {
    fortes: ["conjuntivite", "ceratite", "uveite anterior", "hiperemia conjuntival com secrecao", "olho vermelho doloroso", "hifema", "episclerite"],
  },
  "Clínica Médica>Oftalmologia Clínica>Glaucoma": {
    fortes: ["glaucoma de angulo aberto", "pressao intraocular elevada", "escavacao do disco optico", "campimetria com escotoma arqueado", "glaucoma agudo de angulo fechado"],
  },
  Retinopatias: {
    fortes: ["retinopatia diabetica proliferativa", "retinopatia hipertensiva", "degeneracao macular relacionada a idade", "descolamento de retina", "oclusao de arteria retiniana", "fotocoagulacao retiniana"],
  },
  "Clínica Médica>Oftalmologia Clínica>Catarata": {
    fortes: ["catarata senil", "opacificacao do cristalino", "leucocoria por catarata"],
  },
  "Lombalgia e Dor Musculoesquelética": {
    fortes: ["lombalgia", "lombociatalgia", "hernia de disco lombar", "sinais de alarme na lombalgia", "teste de lasegue", "cervicalgia"],
  },
  "Dor Neuropática": {
    fortes: ["dor neuropatica", "neuralgia pos herpetica", "neuralgia do trigemeo", "dor em queimacao com alodinia"],
    drogas: ["gabapentina", "pregabalina", "amitriptilina para dor"],
  },
  "Dor Oncológica": {
    fortes: ["dor oncologica", "opioide para dor do cancer", "dose de resgate de morfina", "metastase ossea dolorosa"],
  },
  "Farmacologia Analgésica": {
    fortes: ["anti inflamatorio nao esteroidal", "dipirona e paracetamol", "equipotencia de opioides", "tramadol", "codeina", "efeito adverso do opioide"],
  },

  // ---------------- Clínica Médica > Propedêutica e Ética ----------------
  "Semiologia Cardiovascular": {
    fortes: ["ausculta cardiaca com focos", "pulso arterial e turgencia jugular", "ictus cordis", "desdobramento de b2", "sopro de regurgitacao ao exame"],
  },
  "Semiologia Respiratória": {
    fortes: ["ausculta pulmonar com frenito", "expansibilidade e percussao toracica", "frêmito toracovocal", "murmurio vesicular reduzido ao exame"],
  },
  "Semiologia Abdominal": {
    fortes: ["sinal de murphy", "sinal de blumberg", "sinal de rovsing", "piparote", "macicez movel", "sinal de giordano"],
  },
  "Interpretação de Exames Laboratoriais": {
    fortes: ["hemograma completo com plaquetas interpretacao", "interpretacao de exame laboratorial", "eletroforese de proteinas", "urina tipo 1", "funcao hepatica alterada interpretacao"],
  },
  "Raciocínio Clínico e Diagnóstico Diferencial": {
    fortes: ["diagnostico diferencial mais provavel", "hipotese diagnostica mais provavel", "raciocinio clinico"],
  },
  "Anamnese e Exame Físico Geral": {
    fortes: ["anamnese completa", "exame fisico geral", "sinais vitais e antropometria", "queixa e duracao"],
  },
  "Sigilo Médico e Documentação": {
    fortes: ["sigilo medico", "quebra de sigilo", "prontuario medico", "atestado medico", "codigo de etica medica sobre sigilo"],
  },
  "Clínica Médica>Ética e Bioética>Consentimento Informado e Autonomia": {
    fortes: ["consentimento livre e esclarecido", "autonomia do paciente", "recusa de tratamento", "termo de consentimento"],
  },
  "Princípios da Bioética": {
    fortes: ["beneficencia e nao maleficencia", "principios da bioetica", "justica e autonomia bioetica"],
  },

  // ---------------- Cirurgia ----------------
  "Abdome Agudo": {
    fortes: ["abdome agudo", "apendicite aguda", "obstrucao intestinal", "isquemia mesenterica", "perfuracao de viscera oca", "volvo de sigmoide", "peritonite difusa"],
    criterios: ["dor em fossa iliaca direita com defesa", "niveis hidroaereos", "abdome em tabua", "descompressao brusca dolorosa"],
  },
  "Hérnias e Parede Abdominal": {
    fortes: ["hernia inguinal", "hernia umbilical", "hernia incisional", "hernia encarcerada", "hernia estrangulada", "hernioplastia com tela", "hernia femoral"],
  },
  "Doença Biliar": {
    fortes: ["colecistite aguda", "colelitiase", "colecistectomia videolaparoscopica", "vesicula com calculo", "sindrome de mirizzi"],
  },
  "Pré e Pós-operatório": {
    fortes: ["cuidados pos operatorios", "ileo pos operatorio", "deiscencia de anastomose", "infeccao de sitio cirurgico", "profilaxia antibiotica cirurgica", "profilaxia de tromboembolismo no pos operatorio", "febre no pos operatorio"],
  },
  "Avaliação Pré-operatória": {
    fortes: ["avaliacao pre operatoria", "risco cirurgico", "asa i", "indice de lee", "risco cardiovascular perioperatorio", "suspensao de anticoagulante antes da cirurgia"],
  },
  "Cicatrização e Estomas": {
    fortes: ["cicatrizacao por segunda intencao", "queloide", "colostomia", "ileostomia", "cuidados com estoma", "cicatriz hipertrofica"],
  },
  "Cirurgia Bariátrica e do Esôfago-Estômago": {
    fortes: ["cirurgia bariatrica", "bypass gastrico em y de roux", "gastrectomia vertical", "sleeve gastrico", "acalasia", "miotomia de heller", "divertículo de zenker", "hernia de hiato"],
  },
  "Trauma e ATLS": {
    fortes: ["atendimento inicial ao politraumatizado", "abcde do trauma", "escala de coma de glasgow no trauma", "trauma atls", "via aerea definitiva no trauma"],
  },
  "Trauma Abdominal": {
    fortes: ["trauma abdominal fechado", "trauma abdominal penetrante", "lavado peritoneal diagnostico", "fast abdominal", "laparotomia exploradora por trauma", "lesao esplenica"],
  },
  "Trauma Torácico": {
    fortes: ["pneumotorax hipertensivo no trauma", "hemotorax", "torax instavel", "contusao pulmonar", "tamponamento cardiaco traumatico", "toracotomia de reanimacao", "drenagem de torax no trauma"],
  },
  "Trauma Vascular Periférico": {
    fortes: ["lesao vascular periferica", "sinais duros de lesao arterial", "isquemia de membro pos trauma", "sindrome compartimental traumatica"],
  },
  "Traumatismo Cranioencefálico": {
    fortes: ["traumatismo cranioencefalico", "hematoma extradural", "hematoma subdural", "lesao axonal difusa", "hipertensao intracraniana pos trauma", "anisocoria pos trauma"],
  },
  Queimaduras: {
    fortes: ["queimadura de segundo grau", "superficie corporea queimada", "regra dos nove", "formula de parkland", "queimadura de via aerea"],
  },
  "Choque Hemorrágico": {
    fortes: ["choque hemorragico", "classe de hemorragia do atls", "transfusao macica no trauma", "acido tranexamico no trauma", "hipotensao permissiva"],
  },
  "Câncer Gástrico": {
    fortes: ["cancer gastrico", "adenocarcinoma gastrico", "linitis plastica", "gastrectomia com linfadenectomia d2", "linfonodo de virchow"],
  },
  "Cirurgia>Cirurgia Oncológica>Câncer Colorretal": {
    fortes: ["colectomia por neoplasia", "cancer de reto ressecao", "polipo adenomatoso com displasia", "cirurgia do cancer colorretal"],
  },
  "Câncer de Vesícula Biliar": {
    fortes: ["cancer de vesicula biliar", "achado incidental de neoplasia na colecistectomia", "colangiocarcinoma"],
  },
  "Neoplasia Testicular": {
    fortes: ["tumor de testiculo", "massa testicular indolor", "alfafetoproteina e beta hcg em tumor testicular", "orquiectomia radical", "seminoma"],
  },
  "Doença Diverticular": {
    fortes: ["diverticulite aguda", "doenca diverticular do colon", "classificacao de hinchey", "diverticulose"],
  },
  "Doenças Anorretais": {
    fortes: ["hemorroida", "fissura anal", "fistula anal", "abscesso perianal", "plicoma", "prolapso hemorroidario"],
  },
  "Doença Venosa Crônica": {
    fortes: ["varizes de membros inferiores", "ulcera venosa", "dermatite ocre", "classificacao ceap"],
  },
  "Trombose Venosa Profunda": {
    fortes: ["trombose venosa profunda", "doppler venoso de membro inferior", "sinal de homans", "empastamento de panturrilha", "escore de wells para trombose"],
  },
  "Insuficiência Venosa Crônica": {
    fortes: ["insuficiencia venosa cronica", "terapia compressiva elastica", "refluxo em safena magna"],
  },
  "Doença Arterial Periférica": {
    fortes: ["doenca arterial obstrutiva periferica", "claudicacao intermitente", "indice tornozelo braquial", "isquemia critica de membro", "oclusao arterial aguda", "seis p da isquemia"],
  },
  "Cólica Renal e Litíase Urinária": {
    fortes: ["colica nefretica", "litiase urinaria", "calculo ureteral", "hidronefrose por calculo", "litotripsia"],
  },
  "Hiperplasia Prostática Benigna": {
    fortes: ["hiperplasia prostatica benigna", "sintomas do trato urinario inferior com jato fraco", "ipss", "retencao urinaria aguda por prostata"],
    drogas: ["tansulosina", "finasterida", "resseccao transuretral da prostata"],
  },
  "Infecções Urológicas": {
    fortes: ["prostatite aguda", "orquiepididimite", "torcao testicular", "balanopostite", "gangrena de fournier"],
  },
  "Cabeça e Pescoço e Tórax": {
    fortes: ["nodulo cervical", "cancer de laringe", "cancer de boca", "tumor de parotida", "esvaziamento cervical", "traqueostomia", "cancer de tireoide cirurgia"],
  },
  Fraturas: {
    fortes: ["fratura de femur", "fratura exposta", "fratura de radio distal", "fratura de colo de femur", "consolidacao ossea", "imobilizacao gessada", "fratura de clavicula"],
  },
  Luxações: {
    fortes: ["luxacao de ombro", "luxacao de quadril", "luxacao acromioclavicular", "reducao de luxacao"],
  },
  "Lesões Ligamentares": {
    fortes: ["lesao do ligamento cruzado anterior", "entorse de tornozelo", "teste de gaveta anterior", "lesao meniscal", "lesao do manguito rotador"],
  },
  "Malformações e Hidrocefalia": {
    fortes: ["hidrocefalia", "derivacao ventriculoperitoneal", "malformacao de arnold chiari", "craniossinostose", "macrocrania com fontanela abaulada"],
  },
  "Tumores do Sistema Nervoso Central": {
    fortes: ["glioblastoma", "meningioma", "tumor de fossa posterior", "metastase cerebral", "meduloblastoma", "astrocitoma"],
  },
  Mielomeningocele: {
    fortes: ["mielomeningocele", "disrafismo espinhal", "espinha bifida", "defeito de fechamento do tubo neural"],
  },
  "Cirurgia>Oftalmologia>Catarata": {
    fortes: ["facectomia", "cirurgia de catarata com lente intraocular", "facoemulsificacao"],
  },
  "Cirurgia>Oftalmologia>Glaucoma": {
    fortes: ["trabeculectomia", "iridotomia a laser", "cirurgia de glaucoma"],
  },

  // ---------------- Obstetrícia ----------------
  "Diagnóstico e Mudanças Fisiológicas": {
    fortes: ["diagnostico de gravidez", "beta hcg para diagnostico de gestacao", "alteracoes fisiologicas da gestacao", "sinais de presuncao de gravidez"],
  },
  "Datação da Idade Gestacional": {
    fortes: ["idade gestacional pela data da ultima menstruacao", "regra de nagele", "data provavel do parto", "comprimento cabeca nadega para datar"],
  },
  "Rastreamento Pré-natal": {
    fortes: ["exames de rotina do pre natal", "rastreamento no pre natal", "numero de consultas de pre natal", "translucencia nucal", "sorologias do pre natal"],
  },
  "Assistência ao Parto": {
    fortes: ["periodos clinicos do parto", "partograma", "mecanismo de parto", "manobras do parto", "assistencia ao parto normal", "clampeamento do cordao"],
  },
  "Indução do Parto": {
    fortes: ["inducao do parto", "misoprostol para inducao", "ocitocina para inducao", "indice de bishop", "amniotomia para inducao"],
  },
  "Distócias do Trabalho de Parto": {
    fortes: ["distocia de ombro", "manobra de mcroberts", "parada de progressao", "desproporcao cefalopelvica", "distocia funcional", "apresentacao pelvica no trabalho de parto"],
  },
  "Cesárea e Parto Vaginal Após Cesárea": {
    fortes: ["indicacao de cesarea", "cesariana previa com parto vaginal", "rotura uterina em cesareada", "cesarea eletiva"],
  },
  "Parto Humanizado": {
    fortes: ["parto humanizado", "boas praticas na atencao ao parto", "acompanhante no parto", "violencia obstetrica", "plano de parto"],
  },
  "Pré-eclâmpsia": {
    fortes: ["pre eclampsia", "preeclampsia", "proteinuria em gestante", "relacao proteina creatinina em gestante", "hipertensao apos 20 semanas com proteinuria", "pre eclampsia com sinais de gravidade", "iminencia de eclampsia"],
    drogas: ["sulfato de magnesio", "hidralazina endovenosa", "nifedipino em gestante", "metildopa", "aspirina para prevencao de pre eclampsia"],
    criterios: ["escotomas em gestante", "epigastralgia em gestante", "cefaleia em gestante com hipertensao"],
  },
  "Hipertensão Gestacional": {
    fortes: ["hipertensao gestacional sem proteinuria", "hipertensao gestacional", "hipertensao cronica na gestacao"],
  },
  "Eclâmpsia e Síndrome HELLP": {
    fortes: ["eclampsia", "sindrome hellp", "convulsao em gestante com hipertensao", "hemolise com plaquetopenia e enzimas hepaticas elevadas", "esquizocitos com plaquetopenia na gestante"],
  },
  "Diabetes Mellitus Gestacional": {
    fortes: ["diabetes mellitus gestacional", "diabetes gestacional", "teste oral de tolerancia a glicose de 75 g na gestacao", "glicemia de jejum na gestante", "rastreamento de diabetes na gestacao", "macrossomia fetal por diabetes"],
    drogas: ["insulina na gestante"],
  },
  "Cetoacidose Diabética na Gestação": {
    fortes: ["cetoacidose diabetica na gestacao", "cetoacidose em gestante"],
  },
  "Gestação Ectópica": {
    fortes: ["gravidez ectopica", "gestacao ectopica", "prenhez tubaria", "metotrexato para ectopica", "massa anexial com beta hcg positivo", "salpingectomia por ectopica"],
  },
  Abortamento: {
    fortes: ["abortamento", "aborto retido", "aborto incompleto", "ameaca de abortamento", "esvaziamento uterino com curetagem", "abortamento infectado", "colo aberto com sangramento no primeiro trimestre", "aborto legal"],
  },
  "Doença Trofoblástica Gestacional": {
    fortes: ["doenca trofoblastica gestacional", "mola hidatiforme", "coriocarcinoma", "utero em flocos de neve", "beta hcg muito elevado com vesiculas"],
  },
  "Descolamento Prematuro de Placenta": {
    fortes: ["descolamento prematuro de placenta", "sangramento com hipertonia uterina", "utero de couvelaire", "dor abdominal com sangramento escuro no terceiro trimestre"],
  },
  "Placenta Prévia": {
    fortes: ["placenta previa", "acretismo placentario", "sangramento indolor de sangue vivo no terceiro trimestre", "placenta de insercao baixa"],
  },
  "Toxoplasmose na Gestação": {
    fortes: ["toxoplasmose na gestacao", "igg e igm para toxoplasmose em gestante", "teste de avidez de igg", "espiramicina", "sulfadiazina pirimetamina na gestacao"],
  },
  "Sífilis na Gestação": {
    fortes: ["sifilis na gestacao", "sifilis congenita", "vdrl em gestante", "penicilina benzatina em gestante"],
  },
  "Infecção Urinária na Gestação": {
    fortes: ["infeccao urinaria na gestacao", "bacteriuria assintomatica na gestante", "pielonefrite na gestacao"],
  },
  "Infecção Puerperal": {
    fortes: ["infeccao puerperal", "endometrite puerperal", "febre no puerperio", "loquios fetidos"],
  },
  "Dengue na Gestação": {
    fortes: ["dengue na gestacao", "arbovirose em gestante"],
  },
  "Vacinação na Gestação": {
    fortes: ["vacinacao na gestacao", "vacina dtpa na gestante", "vacina na gestante", "vacina contraindicada na gestacao", "influenza na gestante"],
  },
  "Lúpus Eritematoso Sistêmico na Gestação": {
    fortes: ["lupus na gestacao", "lupus eritematoso sistemico na gestacao", "sindrome antifosfolipide na gestacao"],
  },
  "Tireoidopatias na Gestação": {
    fortes: ["hipotireoidismo na gestacao", "hipertireoidismo na gestacao", "tireoide na gestante", "levotiroxina na gestante"],
  },
  "Outras Doenças Clínicas na Gestação": {
    fortes: ["cardiopatia na gestacao", "asma na gestacao", "epilepsia na gestacao", "anemia na gestacao", "trombofilia na gestacao", "hiperemese gravidica", "colestase intra hepatica da gestacao"],
  },
  "Restrição de Crescimento Fetal e Doppler": {
    fortes: ["restricao de crescimento fetal", "dopplervelocimetria de arteria umbilical", "centralizacao fetal", "diastole zero", "perfil biofisico fetal", "cardiotocografia com desaceleracao tardia", "oligoamnio com restricao"],
  },
  "Isoimunização Rh": {
    fortes: ["isoimunizacao rh", "coombs indireto na gestante", "imunoglobulina anti d", "aloimunizacao materno fetal", "hidropsia fetal por anemia"],
  },
  Polidrâmnio: {
    fortes: ["polidramnio", "indice de liquido amniotico aumentado"],
  },
  "Rotura Prematura de Membranas": {
    fortes: ["rotura prematura de membranas", "amniorrexe prematura", "perda de liquido claro em gestante", "corioamnionite"],
  },
  "Trabalho de Parto Prematuro e Tocólise": {
    fortes: ["trabalho de parto prematuro", "tocolise", "corticoide antenatal para maturacao pulmonar", "betametasona antenatal", "nifedipino para tocolise", "cerclagem", "colo curto"],
  },
  "Parvovírus B19 na Gestação": {
    fortes: ["parvovirus b19 na gestacao", "hidropsia fetal por parvovirus"],
  },
  "Fisiologia do Puerpério": {
    fortes: ["puerperio fisiologico", "involucao uterina", "loquios normais", "consulta de revisao puerperal"],
  },
  "Hemorragia Pós-parto": {
    fortes: ["hemorragia pos parto", "atonia uterina", "quatro t da hemorragia pos parto", "ocitocina profilatica no terceiro periodo", "massagem uterina com misoprostol", "balao de bakri", "sutura de b lynch"],
  },
  "Mastite Puerperal": {
    fortes: ["mastite puerperal", "abscesso mamario na lactante", "mastite com fissura mamilar"],
  },
  "Aleitamento Materno": {
    fortes: ["aleitamento materno exclusivo", "pega e posicionamento na amamentacao", "ingurgitamento mamario", "contraindicacao a amamentacao", "banco de leite humano"],
  },

  // ---------------- Ginecologia ----------------
  "Fisiologia da Ovulação": {
    fortes: ["ciclo menstrual fisiologia", "pico de lh com ovulacao", "fase lutea", "muco cervical periovulatorio", "eixo hipotalamo hipofise ovario"],
  },
  Amenorreia: {
    fortes: ["amenorreia primaria", "amenorreia secundaria", "teste da progesterona", "sindrome de asherman", "disgenesia gonadal com amenorreia", "sindrome de rokitansky"],
  },
  "Síndrome dos Ovários Policísticos": {
    fortes: ["sindrome dos ovarios policisticos", "criterios de rotterdam", "hirsutismo com oligomenorreia", "ovarios com multiplos foliculos", "resistencia insulinica com hiperandrogenismo"],
  },
  "Ginecologia>Ciclo Menstrual e Endocrinologia Ginecológica>Puberdade": {
    fortes: ["telarca e pubarca", "estagios de tanner", "menarca"],
  },
  "Sangramento Uterino Anormal": {
    fortes: ["sangramento uterino anormal", "classificacao palm coein", "menorragia", "metrorragia", "sangramento uterino disfuncional"],
  },
  Dismenorreia: {
    fortes: ["dismenorreia primaria", "colica menstrual intensa"],
  },
  Endometriose: {
    fortes: ["endometriose", "dismenorreia progressiva com dispareunia", "endometrioma", "adenomiose", "laparoscopia com focos endometrioticos"],
  },
  "Miomatose Uterina": {
    fortes: ["mioma uterino", "miomatose uterina", "mioma submucoso", "miomectomia", "embolizacao de arteria uterina", "utero aumentado com nodulos miometriais"],
  },
  "Patologia Ovariana": {
    fortes: ["cisto ovariano", "torcao de ovario", "cisto de corpo luteo roto", "massa anexial com indice de risco de malignidade", "teratoma ovariano"],
  },
  Vulvovaginites: {
    fortes: ["candidiase vulvovaginal", "corrimento vaginal", "vulvovaginite atrofica", "prurido vulvar com corrimento grumoso"],
  },
  "Vaginose Bacteriana": {
    fortes: ["vaginose bacteriana", "gardnerella", "criterios de amsel", "clue cells", "corrimento acinzentado com odor de peixe", "teste das aminas"],
    drogas: ["metronidazol"],
  },
  Tricomoníase: {
    fortes: ["tricomoniase", "trichomonas vaginalis", "colo em framboesa", "corrimento amarelo esverdeado bolhoso"],
  },
  "Ginecologia>Infecções Ginecológicas>Infecções Sexualmente Transmissíveis": {
    fortes: ["doenca inflamatoria pelvica", "cervicite por clamidia", "dor a mobilizacao do colo", "abordagem sindromica do corrimento cervical"],
  },
  "Molusco Contagioso": {
    fortes: ["molusco contagioso", "papula umbilicada"],
  },
  "Métodos Contraceptivos": {
    fortes: ["metodo contraceptivo", "dispositivo intrauterino", "diu de cobre", "diu hormonal", "implante subdermico", "contracepcao de emergencia", "laqueadura tubaria", "criterios de elegibilidade da oms para contracepcao"],
  },
  "Contraceptivos Orais Combinados": {
    fortes: ["anticoncepcional oral combinado", "contraceptivo oral combinado", "esquecimento de pilula", "contraindicacao ao estrogenio"],
  },
  "Terapia Hormonal no Climatério": {
    fortes: ["terapia hormonal do climaterio", "reposicao hormonal na menopausa", "contraindicacao a terapia hormonal", "estrogenio com progestagenio no climaterio"],
  },
  "Menopausa e Insuficiência Ovariana": {
    fortes: ["menopausa", "climaterio", "fogachos", "insuficiencia ovariana prematura", "fsh elevado com amenorreia"],
  },
  "Sangramento Pós-menopausa": {
    fortes: ["sangramento na pos menopausa", "espessamento endometrial", "hiperplasia endometrial", "cancer de endometrio", "biopsia de endometrio"],
  },
  "Descarga Papilar": {
    fortes: ["descarga papilar", "secrecao mamilar sanguinolenta", "papiloma intraductal", "derrame papilar"],
  },
  "BI-RADS": {
    fortes: ["bi rads", "birads", "mamografia com microcalcificacoes", "nodulo mamario na mamografia", "classificacao radiologica mamaria"],
  },
  "Patologia Mamária Benigna": {
    fortes: ["fibroadenoma", "alteracao fibrocistica da mama", "cisto mamario", "esteatonecrose mamaria", "mastalgia"],
  },
  "Ginecologia>Oncologia Ginecológica>Câncer de Mama": {
    fortes: ["cancer de mama", "nodulo mamario endurecido aderido", "retracao de pele com pele em casca de laranja", "biopsia mamaria com carcinoma", "linfonodo sentinela mamario", "rastreamento mamografico"],
  },
  "Câncer do Colo do Útero": {
    fortes: ["cancer do colo do utero", "citologia oncotica", "papanicolau com lesao intraepitelial", "nic ii", "colposcopia com biopsia cervical", "conizacao", "hpv de alto risco", "cea colo"],
  },
  "Câncer de Ovário": {
    fortes: ["cancer de ovario", "ca 125 elevado com massa anexial", "carcinomatose peritoneal com ascite", "citorreducao ovariana"],
  },
  "Câncer Hereditário de Mama e Ovário": {
    fortes: ["brca1", "brca2", "sindrome de cancer hereditario de mama e ovario", "mastectomia redutora de risco", "historia familiar forte de cancer de mama e ovario"],
  },
  "Incontinência Urinária": {
    fortes: ["incontinencia urinaria de esforco", "perda urinaria ao tossir", "estudo urodinamico", "sling uretral", "fisioterapia do assoalho pelvico"],
  },
  "Prolapso Genital": {
    fortes: ["prolapso genital", "prolapso uterino", "cistocele", "retocele", "pop q", "distopia genital"],
  },
  "Síndrome da Bexiga Hiperativa": {
    fortes: ["bexiga hiperativa", "urgencia urinaria com nocturia", "anticolinergico para bexiga"],
  },

  // ---------------- Pediatria ----------------
  "Reanimação Neonatal": {
    fortes: ["reanimacao neonatal", "clampeamento do cordao no recem nascido", "ventilacao com pressao positiva no recem nascido", "apgar", "passos iniciais na sala de parto", "massagem cardiaca no recem nascido"],
  },
  "Icterícia Neonatal": {
    fortes: ["ictericia neonatal", "hiperbilirrubinemia neonatal", "fototerapia", "zonas de kramer", "incompatibilidade abo no recem nascido", "kernicterus", "exsanguineotransfusao"],
  },
  Prematuridade: {
    fortes: ["recem nascido prematuro", "prematuro extremo", "doenca da membrana hialina", "surfactante exogeno", "enterocolite necrosante", "retinopatia da prematuridade", "displasia broncopulmonar"],
  },
  "Triagem Neonatal": {
    fortes: ["teste do pezinho", "triagem neonatal", "teste do coracaozinho", "triagem auditiva neonatal", "teste do reflexo vermelho", "hipotireoidismo congenito na triagem", "fenilcetonuria"],
  },
  "Marcos do Desenvolvimento": {
    fortes: ["marcos do desenvolvimento", "sustenta a cabeca", "senta sem apoio", "anda sozinho com", "sorriso social", "atraso do desenvolvimento neuropsicomotor", "curva de crescimento com percentil"],
  },
  "Pediatria>Crescimento e Desenvolvimento>Calendário Vacinal": {
    fortes: ["calendario vacinal da crianca", "vacina aos 2 meses", "vacina bcg no recem nascido", "esquema vacinal infantil", "pentavalente", "rotavirus vacina", "triplice viral aos 12 meses"],
  },
  "Alimentação Infantil": {
    fortes: ["introducao alimentar", "alimentacao complementar aos 6 meses", "formula infantil", "alergia a proteina do leite de vaca"],
  },
  "Aleitamento e Nutrição Infantil": {
    fortes: ["aleitamento materno na infancia", "desmame", "leite materno composicao", "desnutricao infantil com edema"],
  },
  "Calendário Vacinal Pediátrico": {
    fortes: ["calendario vacinal pediatrico", "vacinacao na crianca com atraso", "vacina em prematuro", "contraindicacao de vacina na crianca", "vacina de rotina da crianca"],
  },
  "Doenças Exantemáticas": {
    fortes: ["sarampo", "rubeola", "varicela", "escarlatina", "eritema infeccioso", "exantema subito", "manchas de koplik", "sinal de pastia", "lingua em framboesa", "doenca mao pe boca"],
  },
  "Infecções Respiratórias na Infância": {
    fortes: ["otite media aguda", "laringite estridulosa", "crupe", "epiglotite", "pneumonia na infancia", "amigdalite na crianca", "estridor inspiratorio com tosse de cachorro"],
  },
  Coqueluche: {
    fortes: ["coqueluche", "tosse paroxistica com guincho", "bordetella pertussis", "linfocitose acentuada em lactente"],
  },
  "Parasitoses Intestinais na Infância": {
    fortes: ["ascaridiase", "oxiuriase", "enterobiose", "giardiase", "prurido anal noturno em crianca", "albendazol em crianca"],
  },
  "Arboviroses na Infância": {
    fortes: ["dengue em crianca", "arbovirose na infancia", "sinais de alarme da dengue em crianca"],
  },
  "Asma na Infância": {
    fortes: ["asma na infancia", "crise de asma em crianca", "sibilancia recorrente em pre escolar", "asma no lactente"],
  },
  "Bronquiolite Viral Aguda": {
    fortes: ["bronquiolite viral aguda", "virus sincicial respiratorio", "primeiro episodio de sibilancia em lactente", "palivizumabe", "lactente com coriza e sibilos"],
  },
  "Fibrose Cística": {
    fortes: ["fibrose cistica", "teste do suor", "ileo meconial", "pneumopatia cronica com esteatorreia em crianca", "mutacao delta f508"],
  },
  "Diarreia Aguda e Desidratação": {
    fortes: ["diarreia aguda em crianca", "plano a plano b plano c", "soro de reidratacao oral", "desidratacao em lactente", "gastroenterite por rotavirus", "reidratacao venosa rapida"],
  },
  "Constipação Intestinal Funcional": {
    fortes: ["constipacao funcional em crianca", "escape fecal", "criterios de roma para constipacao", "doenca de hirschsprung"],
  },
  "Refluxo Gastroesofágico na Infância": {
    fortes: ["refluxo gastroesofagico no lactente", "regurgitacao fisiologica do lactente", "estenose hipertrofica de piloro", "vomito em jato no lactente"],
  },
  "Esofagite Eosinofílica": {
    fortes: ["esofagite eosinofilica", "impactacao alimentar com eosinofilos"],
  },
  "Cardiopatias Congênitas Acianóticas": {
    fortes: ["comunicacao interatrial", "comunicacao interventricular", "persistencia do canal arterial", "coarctacao da aorta", "sopro em crianca com hiperfluxo pulmonar"],
  },
  "Cardiopatias Congênitas Cianóticas": {
    fortes: ["tetralogia de fallot", "transposicao das grandes arterias", "atresia pulmonar", "crise de hipoxia com cianose", "teste da hiperoxia", "cardiopatia cianotica no recem nascido"],
  },
  "Circulação Fetal": {
    fortes: ["circulacao fetal", "ducto venoso e forame oval", "canal arterial na circulacao fetal", "transicao circulatoria ao nascimento"],
  },
  "Diabetes Mellitus Tipo 1": {
    fortes: ["diabetes mellitus tipo 1", "cetoacidose diabetica em crianca", "insulinoterapia intensiva em crianca", "diabetes na infancia com poliuria e perda de peso"],
  },
  "Puberdade Precoce e Tardia": {
    fortes: ["puberdade precoce", "puberdade tardia", "telarca precoce", "idade ossea avancada", "analogo de gnrh"],
  },
  "Distúrbios do Crescimento": {
    fortes: ["baixa estatura", "deficiencia de hormonio de crescimento", "velocidade de crescimento reduzida", "estatura alvo com idade ossea"],
  },
  "Anemia Falciforme": {
    fortes: ["anemia falciforme", "crise vaso oclusiva", "hemoglobina s", "sequestro esplenico", "sindrome torácica aguda", "eletroforese de hemoglobina com hb s", "hidroxiureia"],
  },
  "Convulsões na Infância": {
    fortes: ["convulsao febril", "crise convulsiva na crianca", "epilepsia na infancia", "sindrome de west", "espasmo infantil"],
  },
  "Pediatria>Neurologia Pediátrica>Síndrome de Guillain-Barré": {
    fortes: ["guillain barre na crianca", "fraqueza ascendente em crianca"],
  },
  "Reanimação e Suporte de Vida Pediátrico": {
    fortes: ["reanimacao cardiopulmonar em crianca", "pals", "parada cardiorrespiratoria pediatrica", "compressao toracica na crianca", "adrenalina em parada pediatrica"],
  },
  "Via Aérea em Pediatria": {
    fortes: ["intubacao em crianca", "via aerea pediatrica", "tubo sem cuff em crianca", "obstrucao de via aerea por corpo estranho em crianca"],
  },
  "Triagem Pediátrica": {
    fortes: ["triangulo de avaliacao pediatrica", "classificacao de risco em pediatria", "avaliacao inicial da crianca gravemente doente"],
  },

  // ---------------- Emergência e Terapia Intensiva ----------------
  "Regulação Médica de Urgência": {
    fortes: ["regulacao medica das urgencias", "samu", "central de regulacao", "rede de atencao as urgencias"],
  },
  "Transporte Aeromédico": {
    fortes: ["transporte aeromedico", "transporte de paciente critico", "fisiologia de voo no transporte"],
  },
  "Via Aérea no Resgate e Extricação": {
    fortes: ["extricacao veicular", "imobilizacao em prancha rigida", "colar cervical no resgate", "retirada de capacete"],
  },
  "Protocolo de Manchester": {
    fortes: ["protocolo de manchester", "classificacao de risco por cores", "acolhimento com classificacao de risco"],
  },
  "Fast-track e Fluxo do Pronto-Socorro": {
    fortes: ["superlotacao do pronto socorro", "fast track", "fluxo de atendimento na emergencia", "tempo porta agulha"],
  },
  "RCP e Parada Cardiorrespiratória": {
    fortes: ["reanimacao cardiopulmonar de alta qualidade", "compressao toracica com 100 a 120", "desfibrilacao", "ritmo chocavel", "assistolia com protocolo de linha reta", "atividade eletrica sem pulso"],
  },
  "Algoritmos de ACLS/PALS": {
    fortes: ["algoritmo de acls", "parada cardiorrespiratoria acls", "adrenalina a cada 3 a 5 minutos", "cuidados pos parada"],
  },
  "Sequência Rápida de Intubação": {
    fortes: ["sequencia rapida de intubacao", "pre oxigenacao com etomidato", "succinilcolina para intubacao", "rocuronio para intubacao", "manobra de sellick", "cormack lehane"],
  },
  "Modos Ventilatórios e Assincronias": {
    fortes: ["modo ventilatorio pressao controlada", "assincronia paciente ventilador", "peep e driving pressure", "volume corrente de 6 ml kg", "desmame da ventilacao mecanica", "pressao de plato"],
  },
  "Ventilação Não Invasiva": {
    fortes: ["ventilacao nao invasiva", "cpap e bipap", "indicacao de ventilacao nao invasiva", "cateter nasal de alto fluxo"],
  },
  "Classificação e Reconhecimento do Choque": {
    fortes: ["choque cardiogenico", "choque distributivo", "choque hipovolemico", "choque obstrutivo", "classificacao do choque", "perfusao periferica com tempo de enchimento capilar"],
  },
  "Fluidoterapia e Fluidorresponsividade": {
    fortes: ["fluidorresponsividade", "prova de volume", "variacao de pressao de pulso", "elevacao passiva de pernas", "ringer lactato em bolus", "reposicao volemica guiada"],
  },
  "Monitorização Hemodinâmica Invasiva": {
    fortes: ["pressao arterial invasiva", "cateter de arteria pulmonar", "pressao venosa central", "debito cardiaco por termodiluicao", "swan ganz"],
  },
  "Síndromes Toxicológicas": {
    fortes: ["sindrome colinergica", "sindrome anticolinergica", "sindrome opioide com miose", "sindrome simpaticomimetica", "toxidrome"],
  },
  "Antídotos Específicos": {
    fortes: ["n acetilcisteina para paracetamol", "naloxona", "flumazenil", "azul de metileno", "antidoto especifico", "pralidoxima e atropina"],
  },
  "Envenenamento por Animais Peçonhentos": {
    fortes: ["acidente botropico", "acidente crotalico", "acidente laquetico", "escorpionismo", "acidente por aranha marrom", "soro antiveneno", "picada de cobra"],
  },
  "Ultrassom Point-of-Care": {
    fortes: ["ultrassom point of care", "pocus", "protocolo efast", "ultrassom a beira leito"],
  },
  Afogamento: {
    fortes: ["afogamento", "resgate aquatico", "vitima submersa"],
  },
  "Hipotermia e Doença da Altitude": {
    fortes: ["hipotermia acidental", "reaquecimento ativo", "mal agudo das montanhas", "doenca da altitude", "congelamento de extremidade"],
  },
  "Trauma Elétrico": {
    fortes: ["choque eletrico", "trauma eletrico", "queimadura por eletricidade", "raio"],
  },
  "Comando de Incidentes": {
    fortes: ["sistema de comando de incidentes", "plano de resposta a desastre", "gestao de desastre"],
  },
  "Triagem em Massa": {
    fortes: ["triagem em massa", "start triage", "multiplas vitimas com triagem", "incidente com multiplas vitimas"],
  },
  "Acessos Vasculares Guiados por Ultrassom": {
    fortes: ["acesso venoso central guiado por ultrassom", "puncao de veia jugular interna", "acesso intraosseo", "puncao de subclavia"],
  },
  "Drenagens e Punções": {
    fortes: ["toracostomia com drenagem", "pericardiocentese", "paracentese de alivio", "cricotireoidostomia", "puncao lombar procedimento"],
  },
  "Parada Cardiorrespiratória no Adulto": {
    fortes: ["parada cardiorrespiratoria no adulto", "fibrilacao ventricular com desfibrilacao imediata"],
  },
  "Choque: Reconhecimento e Protocolo Inicial": {
    fortes: ["reconhecimento inicial do choque", "protocolo inicial do choque"],
  },
  "Trauma: Avaliação Inicial e ATLS": {
    fortes: ["avaliacao inicial no trauma pelo atls"],
  },
  "Intoxicações: Estabilização Inicial e Antídotos de Primeira Hora": {
    fortes: ["descontaminacao com carvao ativado", "lavagem gastrica na intoxicacao"],
  },
  "POCUS: Point-of-Care Ultrasound na Emergência": {
    fortes: ["ultrassonografia point of care na emergencia"],
  },
  "Sepse e Choque Séptico: Bundles de 1 e 3 Horas, Fonte e Metas": {
    fortes: ["bundle de 1 hora da sepse", "surviving sepsis campaign", "controle de foco na sepse"],
  },
  "Medicina de Emergência e Terapia Intensiva>Procedimentos de Emergência>Ventilação Mecânica": {
    fortes: ["parametros iniciais da ventilacao mecanica", "ventilacao mecanica protetora"],
  },
  "Choque: Vasopressores, Monitorização Avançada e Metas Hemodinâmicas": {
    fortes: ["vasopressor em choque refratario", "meta de pressao arterial media de 65", "vasopressina associada a noradrenalina"],
  },
  "Síndrome do Desconforto Respiratório Agudo (SDRA)": {
    fortes: ["sindrome do desconforto respiratorio agudo", "criterios de berlim", "posicao prona", "relacao pao2 fio2"],
  },
  "Suporte Hemodinâmico": {
    fortes: ["suporte hemodinamico com inotropico", "dobutamina em baixo debito"],
  },
  "Sedação e Analgesia": {
    fortes: ["sedacao em ventilacao mecanica", "escala de ramsay", "rass", "midazolam e fentanil em infusao", "propofol para sedacao", "sedacao para procedimento"],
  },
  "Intoxicação por Medicamentos": {
    fortes: ["intoxicacao por paracetamol", "intoxicacao por benzodiazepinico", "intoxicacao por antidepressivo triciclico", "intoxicacao digitalica", "superdosagem de medicamento"],
  },
  Envenenamentos: {
    fortes: ["envenenamento por planta", "intoxicacao por monoxido de carbono", "envenenamento acidental"],
  },
  "Intoxicação por Drogas de Abuso": {
    fortes: ["intoxicacao por cocaina", "intoxicacao por crack", "overdose de opioide", "intoxicacao por maconha", "uso de cocaina", "overdose de cocaina", "uso de crack"],
    nome: ["cocaina", "crack", "overdose", "anfetamina", "metanfetamina", "ecstasy", "lsd", "opioide"],
    criterios: ["midriase com agitacao", "agitacao psicomotora com taquicardia", "naloxona"],
  },
  Coledocolitíase: {
    fortes: ["coledocolitiase", "calculo no coledoco", "calculo em coledoco", "dilatacao de via biliar principal", "coledoco dilatado", "calculo de via biliar principal"],
    criterios: ["ictericia com colelitiase", "bilirrubina direta elevada com dilatacao de via biliar", "fosfatase alcalina e gama gt elevadas", "colangite aguda"],
    drogas: ["cpre com papilotomia", "papilotomia endoscopica", "exploracao de vias biliares", "coledocotomia"],
  },
  "Autoimunes Sistêmicas: Esclerose, Sjögren e Miopatias": {
    fortes: ["dermatomiosite", "polimiosite", "miopatia inflamatoria", "papulas de gottron", "heliotropo", "esclerose sistemica", "sindrome de sjogren", "esclerodermia", "anti jo 1", "anti scl 70", "anti centromero"],
    criterios: ["fraqueza muscular proximal simetrica", "creatinoquinase elevada com fraqueza", "ck elevada com fraqueza muscular", "olho seco e boca seca", "fenomeno de raynaud com esclerodactilia"],
    drogas: ["biopsia muscular", "eletroneuromiografia com padrao miopatico"],
  },
  "Intoxicação Alcoólica": {
    fortes: ["intoxicacao alcoolica aguda", "intoxicacao por metanol", "intoxicacao por etilenoglicol", "etanol com acidose"],
  },
  "Intoxicação por Agrotóxicos": {
    fortes: ["intoxicacao por organofosforado", "intoxicacao por carbamato", "intoxicacao por agrotoxico", "chumbinho"],
  },
  "Protocolos de Atendimento ao Trauma (ATLS)": {
    fortes: ["protocolo atls de atendimento"],
  },
  "Atendimento ao Politraumatizado": {
    fortes: ["paciente politraumatizado", "atendimento ao politraumatizado"],
  },
  "FAST e Ultrassonografia no Trauma": {
    fortes: ["fast no trauma", "ultrassonografia no trauma"],
  },

  // ---------------- Medicina Preventiva e Social ----------------
  "Legislação do SUS": {
    fortes: ["lei 8080", "lei 8142", "decreto 7508", "legislacao do sus", "norma operacional basica"],
  },
  "Princípios e Diretrizes do SUS": {
    fortes: ["principios do sus", "universalidade integralidade equidade", "descentralizacao e participacao popular", "diretrizes do sus", "hierarquizacao e regionalizacao"],
  },
  "Atenção Primária à Saúde": {
    fortes: ["atributos da atencao primaria", "atencao primaria a saude", "estrategia saude da familia", "primeiro contato com coordenacao do cuidado", "agente comunitario de saude", "nasf"],
  },
  "Prevenção Quaternária": {
    fortes: ["prevencao quaternaria", "sobrediagnostico", "medicalizacao excessiva", "iatrogenia por excesso de intervencao"],
  },
  "Longitudinalidade e Vínculo": {
    fortes: ["longitudinalidade", "vinculo com a equipe de saude", "metodo clinico centrado na pessoa", "abordagem familiar com genograma"],
  },
  "Rastreamento em Atenção Primária": {
    fortes: ["rastreamento populacional", "criterios de rastreamento", "prevencao primaria secundaria e terciaria", "check up sem indicacao"],
  },
  "Medidas de Frequência e Associação": {
    fortes: ["incidencia e prevalencia", "risco relativo", "odds ratio", "risco atribuivel", "numero necessario para tratar", "medida de associacao"],
  },
  "Delineamento de Estudos": {
    fortes: ["estudo de coorte", "estudo caso controle", "ensaio clinico randomizado", "estudo transversal", "delineamento do estudo", "vies de selecao", "fator de confusao"],
  },
  "Testes Diagnósticos": {
    fortes: ["sensibilidade e especificidade", "valor preditivo positivo", "curva roc", "razao de verossimilhanca", "acuracia do teste"],
  },
  "Vigilância Epidemiológica e Notificação": {
    fortes: ["vigilancia epidemiologica", "investigacao de surto", "sinan", "bloqueio vacinal", "busca ativa de casos"],
  },
  "Doenças de Notificação Compulsória": {
    fortes: ["notificacao compulsoria", "lista nacional de notificacao", "notificacao imediata em 24 horas", "doenca de notificacao"],
  },
  "Indicadores de Morbimortalidade": {
    fortes: ["coeficiente de mortalidade infantil", "mortalidade materna", "esperanca de vida ao nascer", "indicador de saude", "letalidade", "taxa de mortalidade padronizada"],
  },
  "Medicina Preventiva e Social>Bioética e Medicina Legal>Consentimento Informado e Autonomia": {
    fortes: ["consentimento em pesquisa", "autonomia do adolescente"],
  },
  "Sigilo Médico": {
    fortes: ["quebra de sigilo por justa causa", "sigilo profissional medico"],
  },
  "Documentos Médico-legais": {
    fortes: ["declaracao de obito", "atestado de obito", "laudo pericial", "boletim medico", "documento medico legal"],
  },
  "Medicina do Trabalho": {
    fortes: ["exame admissional", "atestado de saude ocupacional", "nexo causal ocupacional", "cat comunicacao de acidente de trabalho", "insalubridade"],
  },
  "Doenças Ocupacionais": {
    fortes: ["perda auditiva induzida por ruido", "silicose", "asbestose", "led de esforco repetitivo", "doenca relacionada ao trabalho", "asma ocupacional", "intoxicacao ocupacional por chumbo"],
  },
  "Gestão de Serviços de Saúde": {
    fortes: ["planejamento em saude", "financiamento do sus", "gestao de servico de saude", "avaliacao de servicos de saude", "auditoria em saude"],
  },
  "Segurança do Paciente": {
    fortes: ["seguranca do paciente", "evento adverso", "protocolo de cirurgia segura", "metas internacionais de seguranca", "nucleo de seguranca do paciente", "higiene das maos"],
  },
  Epidemiologia: {
    fortes: ["transicao epidemiologica", "cadeia epidemiologica", "endemia e epidemia"],
  },
  "Sistema Único de Saúde": {
    fortes: ["organizacao do sistema unico de saude", "pacto pela saude", "controle social no sus", "conselho de saude"],
  },
  "Vigilância em Saúde": {
    fortes: ["vigilancia sanitaria", "vigilancia ambiental", "vigilancia em saude do trabalhador"],
  },
  "Políticas Públicas de Saúde": {
    fortes: ["politica nacional de atencao basica", "politica nacional de humanizacao", "rede cegonha", "politica publica de saude", "programa nacional de imunizacoes"],
  },
  "Imunizações do Adulto": {
    fortes: ["vacinacao do adulto", "vacina do idoso", "vacina antitetanica no adulto", "vacina contra influenza no adulto", "profilaxia antirrabica", "vacina hepatite b em adulto"],
  },
  "Estudos Epidemiológicos e Medidas de Associação": {
    fortes: ["interpretacao de intervalo de confianca", "medida de efeito em estudo epidemiologico"],
  },
  "Ética Médica e Bioética": {
    fortes: ["codigo de etica medica", "conselho regional de medicina", "infracao etica", "conflito de interesse medico"],
  },
  "Prevenção de Doenças Crônicas": {
    fortes: ["prevencao de doencas cronicas nao transmissiveis", "hiperdia", "controle do tabagismo", "promocao da saude com atividade fisica"],
  },
  "Medicina Legal e Perícias": {
    fortes: ["perícia medica", "tanatologia", "lesao corporal em pericia", "cadaver com livores", "vulnerabilidade em pericia sexual", "medicina legal"],
  },
  Bioestatística: {
    fortes: ["valor de p", "teste de hipotese", "media mediana e moda", "desvio padrao", "erro tipo i", "poder estatistico", "teste t de student"],
  },
  "Medicina Baseada em Evidências": {
    fortes: ["medicina baseada em evidencias", "revisao sistematica com metanalise", "nivel de evidencia", "grau de recomendacao", "forest plot"],
  },
  "Saúde Mental Coletiva": {
    fortes: ["reforma psiquiatrica", "caps centro de atencao psicossocial", "rede de atencao psicossocial", "luta antimanicomial"],
  },
  "Saúde do Idoso": {
    fortes: ["politica nacional de saude do idoso", "caderneta de saude da pessoa idosa", "atencao ao idoso na atencao primaria"],
  },
  "Saúde da Criança": {
    fortes: ["caderneta da crianca", "puericultura", "atencao integrada as doencas prevalentes na infancia", "aidpi", "acompanhamento do crescimento na atencao primaria"],
  },

  // ---------------- Anestesiologia ----------------
  "Avaliação Pré-anestésica": {
    fortes: ["avaliacao pre anestesica", "jejum pre operatorio", "classificacao asa", "mallampati"],
  },
  "Anestésicos Locais": {
    fortes: ["anestesico local", "lidocaina", "bupivacaina", "dose maxima de anestesico local", "intoxicacao por anestesico local", "emulsao lipidica"],
  },
  "Anestesia Geral e Regional": {
    fortes: ["raquianestesia", "anestesia peridural", "anestesia geral balanceada", "bloqueio do neuroeixo", "nivel de bloqueio sensitivo"],
  },
  "Complicações Anestésicas": {
    fortes: ["hipertermia maligna", "cefaleia pos raquianestesia", "broncoaspiracao na inducao", "hipotensao pos raquianestesia", "dantrolene", "bloqueio subaracnoideo alto"],
  },
  "Farmacologia Anestésica": {
    fortes: ["propofol", "etomidato", "sevoflurano", "cetamina", "opioide em anestesia", "concentracao alveolar minima"],
  },
  "Via Aérea Difícil": {
    fortes: ["via aerea dificil", "mascara laringea", "videolaringoscopio", "algoritmo de via aerea dificil", "nao intubo nao ventilo"],
  },
  "Bloqueios Anestésicos Regionais": {
    fortes: ["bloqueio de plexo braquial", "bloqueio guiado por ultrassom", "bloqueio femoral", "bloqueio interescalenico"],
  },
  "Tipos de Anestesia": {
    fortes: ["sedacao consciente", "anestesia local infiltrativa com sedacao", "escolha da tecnica anestesica"],
  },
  "Relaxantes Musculares": {
    fortes: ["bloqueador neuromuscular", "succinilcolina", "rocuronio", "sugamadex", "neostigmina para reversao", "curarizacao residual"],
  },

  // ---------------- Conhecimentos Gerais ----------------
  "Interpretação de Texto": {
    fortes: ["de acordo com o texto", "no texto o autor", "interpretacao do texto", "segundo o texto acima", "leia o texto a seguir"],
  },
  Gramática: {
    fortes: ["concordancia verbal", "regencia nominal", "crase", "figura de linguagem", "oracao subordinada", "acentuacao grafica", "pontuacao correta"],
  },
  "Legislação EBSERH": {
    fortes: ["ebserh", "empresa brasileira de servicos hospitalares", "regimento interno da ebserh"],
  },
};

/** Sinais de contexto exigidos por área (fora de contexto, a área é penalizada). */
export const CONTEXTO_AREA: Record<string, { pistas: string[]; penalidade: number }> = {
  Pediatria: {
    pistas: [
      "crianca", "criancas", "lactente", "recem nascido", "neonato", "bebe", "escolar", "pre escolar",
      "adolescente", "pediatrico", "pediatria", "meses de vida", "meses de idade", "anos de idade",
      "mae relata", "puericultura", "aleitamento", "prematuro", "vacinal", "menino", "menina",
    ],
    penalidade: 0.35,
  },
  Obstetrícia: {
    pistas: [
      "gestante", "gestacao", "gravida", "gravidez", "puerpera", "puerperio", "pre natal", "idade gestacional",
      "semanas de gestacao", "trabalho de parto", "parto", "cesarea", "feto", "fetal", "amamentacao", "lactante",
      "primigesta", "multipara", "nuligesta", "g2p1",
    ],
    penalidade: 0.3,
  },
  Ginecologia: {
    pistas: [
      "mulher", "paciente do sexo feminino", "menstrual", "menstruacao", "vaginal", "vulvar", "colo do utero",
      "utero", "ovario", "mama", "anexo", "ginecologia", "climaterio", "menopausa", "contracepcao", "sexual",
    ],
    penalidade: 0.55,
  },
  Anestesiologia: {
    pistas: ["anestesia", "anestesico", "anestesiologia", "bloqueio", "sedacao", "intubacao", "cirurgia", "operatorio", "raquianestesia"],
    penalidade: 0.4,
  },
  "Conhecimentos Gerais": {
    pistas: ["texto", "autor", "oracao", "verbo", "gramatica", "ebserh", "vocabulo", "paragrafo", "frase"],
    penalidade: 0.2,
  },
};

/** Contextos que reduzem o peso do termo (condição citada só como antecedente). */
export const MARCADORES_INCIDENTAIS = [
  "antecedente de",
  "antecedentes de",
  "antecedentes pessoais",
  "historia de",
  "historia previa de",
  "historia familiar",
  "historia patologica pregressa",
  "portador de",
  "portadora de",
  "em uso de",
  "faz uso de",
  "uso cronico de",
  "comorbidades",
  "comorbidade",
  "previamente diagnosticado",
  "mae com",
  "pai com",
  "irmao com",
  "avo com",
  "familiar com",
  "tratamento previo de",
  "acompanha por",
  "em acompanhamento por",
];
