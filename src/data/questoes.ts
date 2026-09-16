export type Questao = {
  id: string;
  area: string;
  banca: string;
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  correta: string;
  comentario: string;
};

export const areas = [
  "Clínica Médica",
  "Cirurgia",
  "Pediatria",
  "Obstetrícia e Ginecologia",
  "Medicina Preventiva e Social",
] as const;

export const questoes: Questao[] = [
  {
    id: "q1",
    area: "Clínica Médica",
    banca: "USP 2024",
    enunciado:
      "Homem de 62 anos, tabagista, chega ao pronto-socorro com dor precordial em aperto há 40 minutos, sudorese e ECG com supradesnivelamento de ST em parede anterior. O hospital não dispõe de hemodinâmica e a transferência levaria 3 horas. Qual a conduta imediata mais adequada?",
    alternativas: [
      { letra: "A", texto: "Trombólise química imediata e transferência para centro com hemodinâmica" },
      { letra: "B", texto: "Aguardar transferência para angioplastia primária sem trombólise" },
      { letra: "C", texto: "Solicitar troponina seriada antes de qualquer terapia de reperfusão" },
      { letra: "D", texto: "Iniciar apenas anticoagulação plena e observação em unidade coronariana" },
    ],
    correta: "A",
    comentario:
      "IAMCSST com tempo porta-balão previsto acima de 120 minutos: indica-se fibrinólise nos primeiros 12 horas de sintomas, seguida de transferência para estratégia fármaco-invasiva.",
  },
  {
    id: "q2",
    area: "Pediatria",
    banca: "UNIFESP 2023",
    enunciado:
      "Lactente de 8 meses com febre há 2 dias, coriza e, hoje, sibilância difusa, taquipneia e tiragem subcostal leve. Saturação de 95% em ar ambiente. Qual a conduta inicial?",
    alternativas: [
      { letra: "A", texto: "Corticoide sistêmico e antibiótico oral" },
      { letra: "B", texto: "Suporte clínico com hidratação e oxigênio se necessário" },
      { letra: "C", texto: "Broncodilatador inalatório contínuo por 24 horas" },
      { letra: "D", texto: "Radiografia de tórax e internação obrigatória" },
    ],
    correta: "B",
    comentario:
      "Bronquiolite viral aguda tem tratamento essencialmente de suporte. Corticoide, antibiótico e broncodilatador de rotina não alteram desfecho.",
  },
  {
    id: "q3",
    area: "Obstetrícia e Ginecologia",
    banca: "SUS-SP 2024",
    enunciado:
      "Gestante de 34 semanas apresenta PA 160/110 mmHg, proteinúria 3+, cefaleia e escotomas. Qual a prioridade terapêutica?",
    alternativas: [
      { letra: "A", texto: "Interrupção imediata da gestação por cesárea" },
      { letra: "B", texto: "Sulfato de magnésio e anti-hipertensivo de ação rápida" },
      { letra: "C", texto: "Corticoterapia para maturação pulmonar e alta com reavaliação" },
      { letra: "D", texto: "Diurético de alça para reduzir a pressão arterial" },
    ],
    correta: "B",
    comentario:
      "Pré-eclâmpsia com sinais de iminência de eclâmpsia: sulfato de magnésio para neuroproteção e controle da crise hipertensiva antes de definir a via/momento do parto.",
  },
  {
    id: "q4",
    area: "Cirurgia",
    banca: "UFRJ 2023",
    enunciado:
      "Homem de 25 anos vítima de trauma abdominal fechado, PA 80/50 mmHg mantida após 1L de cristaloide, FAST positivo para líquido livre. Conduta?",
    alternativas: [
      { letra: "A", texto: "Tomografia de abdome com contraste antes de qualquer intervenção" },
      { letra: "B", texto: "Laparotomia exploradora" },
      { letra: "C", texto: "Lavado peritoneal diagnóstico" },
      { letra: "D", texto: "Observação clínica com hematócrito seriado" },
    ],
    correta: "B",
    comentario:
      "Instabilidade hemodinâmica persistente com FAST positivo é indicação de laparotomia imediata; tomografia só em paciente estável.",
  },
  {
    id: "q5",
    area: "Medicina Preventiva e Social",
    banca: "ENARE 2024",
    enunciado:
      "Um estudo acompanha por 10 anos dois grupos de indivíduos, expostos e não expostos ao tabagismo, medindo incidência de DPOC. Que tipo de estudo é esse e qual medida de associação é adequada?",
    alternativas: [
      { letra: "A", texto: "Caso-controle, odds ratio" },
      { letra: "B", texto: "Coorte, risco relativo" },
      { letra: "C", texto: "Transversal, prevalência" },
      { letra: "D", texto: "Ensaio clínico, número necessário para tratar" },
    ],
    correta: "B",
    comentario:
      "Seguimento a partir da exposição para desfecho incidente caracteriza coorte, cuja medida clássica é o risco relativo.",
  },
  {
    id: "q6",
    area: "Clínica Médica",
    banca: "AMRIGS 2024",
    enunciado:
      "Mulher de 45 anos com poliúria, polidipsia e glicemia de jejum de 156 mg/dL em duas ocasiões, assintomática para descompensação. HbA1c 7,4%. Conduta inicial?",
    alternativas: [
      { letra: "A", texto: "Insulina basal em dose plena" },
      { letra: "B", texto: "Metformina associada a mudanças de estilo de vida" },
      { letra: "C", texto: "Apenas dieta e exercício por 6 meses" },
      { letra: "D", texto: "Sulfonilureia como monoterapia de escolha" },
    ],
    correta: "B",
    comentario:
      "DM2 recém-diagnosticado com HbA1c < 9% e sem catabolismo: metformina + MEV é a primeira linha.",
  },
  {
    id: "q7",
    area: "Pediatria",
    banca: "SES-DF 2023",
    enunciado:
      "Criança de 3 anos com febre alta há 6 dias, conjuntivite bilateral não purulenta, língua em framboesa, exantema polimorfo e descamação periungueal. Exame prioritário?",
    alternativas: [
      { letra: "A", texto: "Ecocardiograma" },
      { letra: "B", texto: "Sorologia para dengue" },
      { letra: "C", texto: "Punção lombar" },
      { letra: "D", texto: "Cultura de orofaringe" },
    ],
    correta: "A",
    comentario:
      "Quadro típico de doença de Kawasaki; o ecocardiograma avalia aneurismas de coronárias, principal complicação.",
  },
  {
    id: "q8",
    area: "Obstetrícia e Ginecologia",
    banca: "UNICAMP 2024",
    enunciado:
      "Mulher de 30 anos, sem comorbidades, deseja contracepção de longa duração e tem enxaqueca com aura. Melhor opção?",
    alternativas: [
      { letra: "A", texto: "Anticoncepcional combinado oral" },
      { letra: "B", texto: "Adesivo transdérmico combinado" },
      { letra: "C", texto: "DIU de cobre ou sistema intrauterino de levonorgestrel" },
      { letra: "D", texto: "Anel vaginal combinado" },
    ],
    correta: "C",
    comentario:
      "Enxaqueca com aura contraindica estrogênio (categoria 4 da OMS). Métodos de longa duração sem estrogênio são preferidos.",
  },
];
