import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

const MODELO = "google/gemini-3.7-flash";
const DURACAO_TOKEN_MS = 3 * 60 * 60 * 1000;

const turnos = z
  .array(
    z.object({
      papel: z.enum(["user", "assistant"]),
      texto: z.string().min(1).max(4000),
      canal: z
        .enum(["paciente", "exame", "avaliador"])
        .optional()
        .default("paciente"),
    }),
  )
  .max(60);
const cenarioSchema = z.enum(["emergencia", "ambulatorio"]);
const dificuldadeSchema = z.enum(["basico", "intermediario", "avancado"]);
const canalSchema = z.enum(["paciente", "exame", "avaliador"]);

const casoSchema = z.object({
  dificuldade: dificuldadeSchema.default("intermediario"),
  queixa: z.string().min(1),
  paciente: z.object({
    nome: z.string().min(1),
    idade: z.number().int().min(1).max(110),
    sexo: z.enum(["feminino", "masculino"]),
    ocupacao: z.string().min(1),
    personalidade: z.string().min(1),
    estadoEmocional: z.string().min(1),
    jeitoDeFalar: z.string().min(1),
  }),
  historia: z.string().min(1),
  sinaisVitais: z.string().min(1),
  exameFisico: z.string().min(1),
  examesComplementares: z.string().min(1),
  diagnostico: z.string().min(1),
  diferenciais: z.array(z.string().min(1)).min(1).max(8),
  conduta: z.string().min(1),
});

type Caso = z.infer<typeof casoSchema>;

const estacoesFixas: {
  id: string;
  titulo: string;
  area: string;
  resumo: string;
  cenario: z.infer<typeof cenarioSchema>;
  caso: Caso;
}[] = [
  {
    id: "sca-com-supra",
    titulo: "Dor torácica no pronto-socorro",
    area: "Cardiologia",
    resumo: "Dor torácica típica com necessidade de abordagem imediata.",
    cenario: "emergencia",
    caso: {
      dificuldade: "avancado",
      queixa: "Doutor, estou com uma pressão muito forte no peito.",
      paciente: {
        nome: "Carlos Menezes",
        idade: 58,
        sexo: "masculino",
        ocupacao: "motorista",
        personalidade: "direto, mas assustado e impaciente",
        estadoEmocional: "ansioso por causa da dor intensa",
        jeitoDeFalar: "frases curtas, entrecortadas pela dor",
      },
      historia:
        "Dor retroesternal em pressão há 45 minutos, intensidade 9/10, irradiada para braço esquerdo e mandíbula, associada a sudorese e náusea. Hipertenso, diabético e tabagista. Usa metformina irregularmente e não sabe informar o anti-hipertensivo. Nega alergias.",
      sinaisVitais:
        "PA 154/96 mmHg, FC 104 bpm, FR 24 irpm, SpO2 94% em ar ambiente, temperatura 36,5 °C, glicemia 218 mg/dL.",
      exameFisico:
        "Pálido, sudoreico e ansioso. Bulhas rítmicas, sem sopros. Pulsos simétricos. Ausculta pulmonar sem estertores. Perfusão periférica limítrofe.",
      examesComplementares:
        "ECG em até 10 minutos: supradesnivelamento de ST em DII, DIII e aVF, com infradesnivelamento recíproco em DI e aVL. Troponina inicial elevada. Radiografia sem alargamento mediastinal.",
      diagnostico:
        "Infarto agudo do miocárdio com supradesnivelamento de ST inferior.",
      diferenciais: [
        "Dissecção aguda de aorta",
        "Tromboembolismo pulmonar",
        "Pericardite aguda",
      ],
      conduta:
        "Monitorização, acesso venoso, AAS, segundo antiagregante e anticoagulação conforme protocolo, nitrato se não houver contraindicação, analgesia, estatina de alta potência e reperfusão imediata, preferencialmente angioplastia primária. Avaliar derivações direitas antes de nitrato.",
    },
  },
  {
    id: "asma-pediatrica",
    titulo: "Crise de asma em criança",
    area: "Pediatria",
    resumo:
      "Dispneia e sibilância com avaliação de gravidade e tratamento inicial.",
    cenario: "emergencia",
    caso: {
      dificuldade: "intermediario",
      queixa: "Meu filho está cansado para respirar e chiando desde ontem.",
      paciente: {
        nome: "Helena Alves",
        idade: 32,
        sexo: "feminino",
        ocupacao: "auxiliar administrativa e mãe do paciente",
        personalidade: "colaborativa, atenta e protetora",
        estadoEmocional: "preocupada, mas consegue responder com clareza",
        jeitoDeFalar: "fala rápida e detalhada quando perguntada",
      },
      historia:
        "Mãe responde por menino de 7 anos com tosse, dispneia e sibilância após quadro viral há 24 horas. Usa salbutamol apenas nas crises, três exacerbações no último ano e uma ida à emergência. Sem internação em UTI. Rinite alérgica. Sem febre ou engasgo.",
      sinaisVitais:
        "FC 128 bpm, FR 36 irpm, SpO2 91% em ar ambiente, temperatura 36,8 °C, peso 25 kg.",
      exameFisico:
        "Criança alerta, fala frases curtas, tiragem subcostal, tempo expiratório prolongado e sibilos difusos bilateralmente. Entrada de ar reduzida, sem assimetria.",
      examesComplementares:
        "Não há indicação inicial obrigatória de radiografia ou gasometria. Se solicitada por piora: radiografia com hiperinsuflação, sem consolidação.",
      diagnostico: "Exacerbação aguda moderada a grave de asma.",
      diferenciais: [
        "Pneumonia",
        "Aspiração de corpo estranho",
        "Bronquiolite em faixa etária inadequada",
      ],
      conduta:
        "Oxigênio para alvo de saturação adequado, salbutamol inalatório repetido, associar ipratrópio nas crises graves, corticoide sistêmico precoce e reavaliar resposta. Considerar sulfato de magnésio intravenoso se refratária.",
    },
  },
  {
    id: "pre-eclampsia-grave",
    titulo: "Gestante com cefaleia e hipertensão",
    area: "Obstetrícia",
    resumo:
      "Reconhecimento e manejo inicial de pré-eclâmpsia com sinais de gravidade.",
    cenario: "emergencia",
    caso: {
      dificuldade: "avancado",
      queixa:
        "Estou com uma dor de cabeça muito forte e minha visão está estranha.",
      paciente: {
        nome: "Mariana Rocha",
        idade: 29,
        sexo: "feminino",
        ocupacao: "professora",
        personalidade: "objetiva e preocupada com o bebê",
        estadoEmocional: "apreensiva e desconfortável",
        jeitoDeFalar: "responde bem, mas insiste em perguntar sobre o bebê",
      },
      historia:
        "Primigesta de 35 semanas e 2 dias, cefaleia intensa há 6 horas, escotomas e dor epigástrica. Movimentos fetais presentes. Nega sangramento e perda de líquido. Pré-natal previamente sem hipertensão. Sem comorbidades ou alergias.",
      sinaisVitais:
        "PA 168/112 mmHg, repetida após 15 minutos 166/110 mmHg, FC 92 bpm, FR 18 irpm, SpO2 98%, temperatura 36,6 °C.",
      exameFisico:
        "Consciente, orientada, hiperreflexia patelar, edema em membros inferiores. Abdome gravídico, sem hipertonia. BCF 146 bpm.",
      examesComplementares:
        "Plaquetas 92.000/mm³, TGO 86 U/L, TGP 74 U/L, creatinina 1,0 mg/dL, DHL 650 U/L, relação proteína/creatinina urinária 0,5. Cardiotocografia inicialmente tranquilizadora.",
      diagnostico:
        "Pré-eclâmpsia com sinais de gravidade e provável síndrome HELLP parcial.",
      diferenciais: [
        "Hipertensão gestacional",
        "Hipertensão arterial crônica",
        "Esteatose hepática aguda da gestação",
      ],
      conduta:
        "Internação, sulfato de magnésio para profilaxia de eclâmpsia, tratamento urgente da hipertensão grave, avaliação materno-fetal e interrupção da gestação após estabilização, sem postergar por corticoterapia.",
    },
  },
  {
    id: "dm2-ubs",
    titulo: "Diabetes tipo 2 na UBS",
    area: "Endocrinologia",
    resumo:
      "Consulta longitudinal com revisão de controle e prevenção de complicações.",
    cenario: "ambulatorio",
    caso: {
      dificuldade: "basico",
      queixa: "Vim renovar minhas receitas e conferir como está meu açúcar.",
      paciente: {
        nome: "Rita de Cássia",
        idade: 54,
        sexo: "feminino",
        ocupacao: "costureira",
        personalidade:
          "comunicativa e receptiva, mas tem dificuldade com mudanças na alimentação",
        estadoEmocional: "tranquila",
        jeitoDeFalar: "simples, espontâneo e coloquial",
      },
      historia:
        "Diabetes tipo 2 há 6 anos, usa metformina 850 mg duas vezes ao dia, mas esquece doses. Poliúria discreta e visão borrada eventual. Hipertensa em uso de losartana. Sedentária. Nega tabagismo, dor torácica, hipoglicemia e feridas nos pés.",
      sinaisVitais:
        "PA 142/88 mmHg, FC 78 bpm, IMC 31 kg/m², circunferência abdominal 99 cm.",
      exameFisico:
        "Bom estado geral. Pulsos pediosos presentes. Pele íntegra nos pés, sensibilidade reduzida ao monofilamento em dois pontos plantares. Fundoscopia não disponível na unidade.",
      examesComplementares:
        "HbA1c 8,4%, glicemia de jejum 176 mg/dL, creatinina 0,8 mg/dL, relação albumina/creatinina 42 mg/g, LDL 138 mg/dL.",
      diagnostico:
        "Diabetes mellitus tipo 2 fora da meta, com albuminúria e provável neuropatia periférica inicial.",
      diferenciais: [
        "Baixa adesão medicamentosa",
        "Diabetes autoimune do adulto menos provável",
      ],
      conduta:
        "Abordar adesão e estilo de vida, intensificar tratamento individualizado, controlar pressão e lipídios, confirmar/persistir albuminúria, proteger rim conforme indicação, avaliar retina e pés periodicamente, atualizar vacinas.",
    },
  },
];

async function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Configuração de IA ausente (LOVABLE_API_KEY).");
  const { createLovableAiGatewayProvider } =
    await import("./ai-gateway.server");
  return createLovableAiGatewayProvider(key);
}

function extrairJson(texto: string): unknown {
  const limpo = texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio === -1 || fim === -1) throw new Error("Resposta de IA inválida.");
  return JSON.parse(limpo.slice(inicio, fim + 1));
}

function base64Url(bytes: Uint8Array) {
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function deBase64Url(valor: string) {
  const normalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(
    normalizado + "=".repeat((4 - (normalizado.length % 4)) % 4),
  );
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

async function chaveToken() {
  const segredo =
    process.env["OSCE_CASE_SECRET"] || process.env["LOVABLE_API_KEY"];
  if (!segredo) throw new Error("Configuração segura do OSCE ausente.");
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`osce-v1:${segredo}`),
  );
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function selarCaso(caso: Caso, cenario: z.infer<typeof cenarioSchema>) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const conteudo = new TextEncoder().encode(
    JSON.stringify({ caso, cenario, exp: Date.now() + DURACAO_TOKEN_MS }),
  );
  const cifrado = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode("osce:v1"),
    },
    await chaveToken(),
    conteudo,
  );
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(cifrado))}`;
}

async function abrirCaso(token: string) {
  try {
    const [versao, iv, cifrado] = token.split(".");
    if (versao !== "v1" || !iv || !cifrado) throw new Error();
    const aberto = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: deBase64Url(iv),
        additionalData: new TextEncoder().encode("osce:v1"),
      },
      await chaveToken(),
      deBase64Url(cifrado),
    );
    const payload = z
      .object({ caso: casoSchema, cenario: cenarioSchema, exp: z.number() })
      .parse(JSON.parse(new TextDecoder().decode(aberto)));
    if (payload.exp < Date.now()) throw new Error();
    return payload;
  } catch {
    throw new Error(
      "Esta estação expirou ou é inválida. Inicie uma nova estação.",
    );
  }
}

const descricaoCenario = {
  emergencia:
    "Cenário: EMERGÊNCIA / PRONTO-SOCORRO. Quadro agudo ou de risco; espera-se abordagem ágil, ABCDE, estabilização, anamnese dirigida e sinais vitais.",
  ambulatorio:
    "Cenário: AMBULATÓRIO / UBS. Consulta eletiva; espera-se anamnese abrangente, contexto psicossocial, prevenção e exame físico dirigido.",
} as const;

function casoParaTexto(caso: Caso) {
  return [
    `DIFICULDADE: ${caso.dificuldade}`,
    `QUEIXA: ${caso.queixa}`,
    `PACIENTE: ${caso.paciente.nome}, ${caso.paciente.idade} anos, sexo ${caso.paciente.sexo}, ${caso.paciente.ocupacao}`,
    `PERFIL: ${caso.paciente.personalidade}; ${caso.paciente.estadoEmocional}; fala ${caso.paciente.jeitoDeFalar}`,
    `HISTÓRIA: ${caso.historia}`,
    `SINAIS VITAIS: ${caso.sinaisVitais}`,
    `EXAME FÍSICO: ${caso.exameFisico}`,
    `EXAMES COMPLEMENTARES: ${caso.examesComplementares}`,
    `DIAGNÓSTICO: ${caso.diagnostico}`,
    `DIFERENCIAIS: ${caso.diferenciais.join(", ")}`,
    `CONDUTA: ${caso.conduta}`,
  ].join("\n");
}

export const recursosAudioOsce = createServerFn({ method: "GET" }).handler(
  async () => ({
    neural: Boolean(process.env["OPENAI_API_KEY"]),
  }),
);

export const listarEstacoesFixasOsce = createServerFn({
  method: "GET",
}).handler(async () =>
  estacoesFixas.map(({ id, titulo, area, resumo, cenario, caso }) => ({
    id,
    titulo,
    area,
    resumo,
    cenario,
    dificuldade: caso.dificuldade,
  })),
);

export const gerarCaso = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        tema: z.string().min(1).max(200),
        cenario: cenarioSchema,
        dificuldade: dificuldadeSchema.default("intermediario"),
        estacaoId: z.string().max(100).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const fixa = data.estacaoId
      ? estacoesFixas.find((estacao) => estacao.id === data.estacaoId)
      : undefined;
    let caso: Caso;
    let cenario = data.cenario;
    if (fixa) {
      caso = casoSchema.parse(fixa.caso);
      cenario = fixa.cenario;
    } else {
      const provider = await gateway();
      const intensidade = {
        basico:
          "Quadro típico, paciente colaborativo, poucas comorbidades e dados sem ambiguidades.",
        intermediario:
          "Inclua alguns diagnósticos diferenciais e informações que só aparecem com perguntas direcionadas.",
        avancado:
          "Paciente pouco colaborativo, ansioso ou instável; dados incompletos e necessidade de priorização, sem tornar o caso incoerente.",
      }[data.dificuldade];
      const result = streamText({
        model: provider(MODELO),
        system:
          "Você cria estações OSCE realistas no Brasil. Responda somente com JSON válido, sem markdown. Não use informação identificável real.",
        prompt: `Tema: ${data.tema}\n${descricaoCenario[data.cenario]}\nDificuldade ${data.dificuldade}: ${intensidade}\n\nCrie um caso coerente no formato exato:\n{"dificuldade":"${data.dificuldade}","queixa":"frase curta na voz do paciente","paciente":{"nome":"nome fictício","idade":35,"sexo":"feminino|masculino","ocupacao":"...","personalidade":"traço que afeta a conversa","estadoEmocional":"...","jeitoDeFalar":"..."},"historia":"HDA, sintomas, antecedentes, medicações, alergias, hábitos e história familiar","sinaisVitais":"...","exameFisico":"achados por sistemas","examesComplementares":"resultados disponíveis","diagnostico":"...","diferenciais":["..."],"conduta":"conduta e orientações esperadas"}. Varie sexo, idade e personalidade de forma clinicamente plausível.`,
      });
      caso = casoSchema.parse(extrairJson(await result.text));
    }
    const sessaoToken = await selarCaso(caso, cenario);
    return {
      sessaoToken,
      cenario,
      apresentacao: {
        queixa: caso.queixa,
        nome: caso.paciente.nome,
        idade: caso.paciente.idade,
        sexo: caso.paciente.sexo,
        estadoEmocional: caso.paciente.estadoEmocional,
        dificuldade: caso.dificuldade,
      },
    };
  });

export const falarComPaciente = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        sessaoToken: z.string().min(20).max(30000),
        historico: turnos,
        fala: z.string().min(1).max(4000),
        canal: canalSchema.default("paciente"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { caso, cenario } = await abrirCaso(data.sessaoToken);
    if (data.canal === "avaliador") {
      return {
        fala: "Informação registrada para a avaliação final.",
        canal: "avaliador" as const,
      };
    }
    const provider = await gateway();
    const sistema =
      data.canal === "exame"
        ? `Você é o AVALIADOR que fornece resultados objetivos em uma estação OSCE. Responda somente ao exame, sinal vital, manobra ou exame complementar solicitado. Seja conciso, sem interpretar, dar diagnóstico, sugerir conduta ou entregar achados não solicitados. Se a solicitação for vaga, peça ao candidato que especifique.\n\nCASO CONFIDENCIAL:\n${casoParaTexto(caso)}`
        : `Você interpreta exclusivamente o PACIENTE de um OSCE brasileiro. Nunca se apresente como IA, avalie o candidato, dê dicas ou revele diagnóstico/conduta.\n${descricaoCenario[cenario]}\n\nPERSONAGEM: ${caso.paciente.nome}, ${caso.paciente.idade} anos, ${caso.paciente.sexo}, ${caso.paciente.ocupacao}. Personalidade: ${caso.paciente.personalidade}. Estado emocional: ${caso.paciente.estadoEmocional}. Jeito de falar: ${caso.paciente.jeitoDeFalar}.\n\nREGRAS: fale em português do Brasil, linguagem leiga e natural. Varie ritmo e hesitação conforme a emoção, sem bordões repetitivos. Responda em 1 a 3 frases e revele apenas o que foi explicitamente perguntado. Você não conhece resultados objetivos de exame físico, sinais vitais ou exames complementares: se o candidato pedir isso neste canal, responda como paciente e não forneça o achado. Se faltar um detalhe, responda de modo plausível sem criar pista diagnóstica.\n\nCASO CONFIDENCIAL:\n${casoParaTexto(caso)}`;
    const result = streamText({
      model: provider(MODELO),
      system: sistema,
      messages: [
        ...data.historico
          .filter((m) => m.canal === data.canal)
          .slice(-20)
          .map((m) => ({ role: m.papel, content: m.texto }) as const),
        { role: "user" as const, content: data.fala },
      ],
    });
    return { fala: (await result.text).trim(), canal: data.canal };
  });

export const transcreverAudioOsce = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        audioBase64: z.string().min(20).max(16_000_000),
        mimeType: z.string().max(100),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env["OPENAI_API_KEY"];
    if (!key) throw new Error("Transcrição neural não configurada.");
    const bytes = Uint8Array.from(atob(data.audioBase64), (c) =>
      c.charCodeAt(0),
    );
    const form = new FormData();
    form.append(
      "file",
      new Blob([bytes.buffer as ArrayBuffer], { type: data.mimeType }),
      data.mimeType.includes("mp4") ? "fala.mp4" : "fala.webm",
    );
    form.append("model", "gpt-transcribe");
    form.append(
      "prompt",
      "Consulta médica OSCE em português do Brasil. Preserve termos clínicos e nomes de exames.",
    );
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      },
    );
    if (!response.ok)
      throw new Error("Não foi possível transcrever o áudio agora.");
    const json = (await response.json()) as { text?: string };
    if (!json.text?.trim()) throw new Error("Nenhuma fala foi identificada.");
    return { texto: json.text.trim() };
  });

export const sintetizarFalaOsce = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        texto: z.string().min(1).max(2500),
        sexo: z.enum(["feminino", "masculino"]),
        idade: z.number().int().min(1).max(110),
        emocao: z.string().max(300),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env["OPENAI_API_KEY"];
    if (!key) throw new Error("Voz neural não configurada.");
    const voz = data.sexo === "feminino" ? "marin" : "cedar";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: voz,
        input: data.texto,
        response_format: "wav",
        instructions: `Fale em português brasileiro como paciente ${data.sexo} de ${data.idade} anos. Emoção: ${data.emocao}. Tom natural, conversacional e não teatral.`,
      }),
    });
    if (!response.ok) throw new Error("Não foi possível gerar a voz agora.");
    return {
      audioBase64: base64Url(new Uint8Array(await response.arrayBuffer())),
      mimeType: "audio/wav",
    };
  });

export type CriterioAvaliado = {
  criterio: string;
  desempenho: "ruim" | "parcial" | "boa";
  peso: number;
  pontos: number;
  comentario: string;
  evidencias: string[];
};

export type Avaliacao = {
  nota: number;
  criterios: CriterioAvaliado[];
  correcao: string;
  casoParaHistorico: string;
};

export const avaliarEstacao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        sessaoToken: z.string().min(20).max(30000),
        historico: turnos,
        barema: z.string().max(6000).optional(),
        duracaoSegundos: z.number().int().min(0).max(7200),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Avaliacao> => {
    const { caso, cenario } = await abrirCaso(data.sessaoToken);
    const provider = await gateway();
    const barema =
      data.barema && data.barema.trim().length > 20
        ? `Use obrigatoriamente o barema abaixo. Extraia o peso numérico de cada item (aceite vírgula decimal); se um item não trouxer peso, use 1.\n${data.barema}`
        : `Crie 10 a 14 critérios com peso 1 cobrindo comunicação, anamnese, ${cenario === "emergencia" ? "ABCDE, sinais vitais e estabilização" : "contexto psicossocial, prevenção e exame dirigido"}, exames, diagnóstico, diferenciais, conduta e orientações.`;
    const transcricao = data.historico
      .map(
        (m) =>
          `${
            m.papel === "user"
              ? m.canal === "avaliador"
                ? "CANDIDATO AO AVALIADOR"
                : m.canal === "exame"
                  ? "CANDIDATO SOLICITA EXAME"
                  : "CANDIDATO AO PACIENTE"
              : m.canal === "exame"
                ? "RESULTADO DO EXAME"
                : m.canal === "avaliador"
                  ? "AVALIADOR"
                  : "PACIENTE"
          }: ${m.texto}`,
      )
      .join("\n");
    const result = streamText({
      model: provider(MODELO),
      system:
        'Você é examinador rigoroso e justo de OSCE no Brasil. Responda somente JSON válido: {"criterios":[{"criterio":string,"desempenho":"ruim"|"parcial"|"boa","peso":number,"comentario":string,"evidencias":[string]}],"correcao":string}.',
      prompt: `${barema}\n\n${descricaoCenario[cenario]}\nDificuldade: ${caso.dificuldade}.\n\nCASO:\n${casoParaTexto(caso)}\n\nTRANSCRIÇÃO (${Math.round(data.duracaoSegundos / 60)} min):\n${transcricao || "(sem interação)"}\n\nClassifique: ruim=0%, parcial=50%, boa=100%. Preserve todos os pesos do barema. Para cada critério, copie em "evidencias" até 3 trechos curtos e literais da transcrição que sustentem a nota. Se não houver comprovação, use lista vazia e não presuma que o candidato fez. Ignore as confirmações automáticas do avaliador. Na correção, explique diagnóstico, diferenciais, conduta ideal e melhorias concretas.`,
    });
    const bruto = extrairJson(await result.text) as {
      criterios?: {
        criterio?: string;
        desempenho?: string;
        peso?: number;
        comentario?: string;
        evidencias?: string[];
      }[];
      correcao?: string;
    };
    const criterios: CriterioAvaliado[] = (bruto.criterios ?? [])
      .slice(0, 30)
      .map((c) => {
        const desempenho =
          c.desempenho === "boa"
            ? "boa"
            : c.desempenho === "parcial"
              ? "parcial"
              : "ruim";
        const peso =
          Number.isFinite(c.peso) && Number(c.peso) > 0
            ? Math.min(Number(c.peso), 100)
            : 1;
        const fracao =
          desempenho === "boa" ? 1 : desempenho === "parcial" ? 0.5 : 0;
        return {
          criterio: c.criterio?.trim() || "Critério",
          desempenho,
          peso,
          pontos: Math.round(peso * fracao * 100) / 100,
          comentario: c.comentario?.trim() || "",
          evidencias: (c.evidencias ?? [])
            .filter((e) => typeof e === "string" && e.trim())
            .slice(0, 3)
            .map((e) => e.trim().slice(0, 300)),
        };
      });
    const total = criterios.reduce((s, c) => s + c.peso, 0);
    const obtido = criterios.reduce((s, c) => s + c.pontos, 0);
    const nota = total ? Math.round((obtido / total) * 100) / 10 : 0;
    return {
      nota,
      criterios,
      correcao: bruto.correcao?.trim() || "",
      casoParaHistorico: casoParaTexto(caso),
    };
  });
