import { useEffect, useMemo, useRef, useState } from "react";
import { exigirLogin, useSessao } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Ambulance,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Gauge,
  History,
  Library,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  Shuffle,
  Square,
  Stethoscope,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { buscarTaxonomia } from "@/lib/banco";
import {
  avaliarEstacao,
  falarComPaciente,
  gerarCaso,
  listarEstacoesFixasOsce,
  recursosAudioOsce,
  sintetizarFalaOsce,
  transcreverAudioOsce,
} from "@/lib/osce.functions";
import type { Avaliacao, CriterioAvaliado } from "@/lib/osce.functions";
import {
  buscarSessoesOsce,
  metricasOsce,
  registrarEventoOsce,
  salvarSessaoOsce,
} from "@/lib/osce";

export const Route = createFileRoute("/osce")({
  beforeLoad: exigirLogin,
  head: () => ({
    meta: [
      { title: "OSCE AZ — simulação prática de atendimento | ResidênciaPro" },
      {
        name: "description",
        content:
          "Simulador OSCE com paciente de IA, voz, cronômetro, barema e feedback.",
      },
    ],
  }),
  component: Osce,
});

type Canal = "paciente" | "exame" | "avaliador";
type Dificuldade = "basico" | "intermediario" | "avancado";
type Turno = { papel: "user" | "assistant"; texto: string; canal: Canal };
type Etapa = "config" | "estacao" | "relatorio" | "historico";
type Cenario = "emergencia" | "ambulatorio";
type EstadoMic =
  "ocioso" | "solicitando" | "ouvindo" | "transcrevendo" | "pronto";
type PerfilPaciente = {
  nome: string;
  idade: number;
  sexo: "feminino" | "masculino";
  estadoEmocional: string;
  dificuldade: Dificuldade;
};
type Envio = { fala: string; historico: Turno[]; canal: Canal };

const TEMPOS = [5, 8, 10, 15, 20];
const AUDIO_SILENCIOSO =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

const CANAIS: Record<
  Canal,
  { rotulo: string; curto: string; placeholder: string }
> = {
  paciente: {
    rotulo: "Falar com o paciente",
    curto: "Paciente",
    placeholder: "Pergunte ao paciente",
  },
  exame: {
    rotulo: "Solicitar exame",
    curto: "Exames",
    placeholder: "Ex.: aferir PA ou auscultar os pulmões",
  },
  avaliador: {
    rotulo: "Informar diagnóstico e conduta",
    curto: "Avaliador",
    placeholder: "Declare sua hipótese, conduta ou orientação",
  },
};

function formatar(seg: number) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function mensagemErro(erro: unknown, padrao: string) {
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

function erroMicrofone(codigo?: string) {
  if (codigo === "not-allowed" || codigo === "service-not-allowed")
    return "A permissão do microfone foi bloqueada. Libere-a nas configurações do navegador e tente novamente.";
  if (codigo === "audio-capture" || codigo === "NotFoundError")
    return "Nenhum microfone foi encontrado. Conecte ou habilite um dispositivo de entrada.";
  if (codigo === "no-speech")
    return "Nenhuma fala foi detectada. Aproxime-se do microfone e tente novamente.";
  if (codigo === "network")
    return "O reconhecimento de voz ficou sem conexão. Você pode continuar digitando.";
  if (codigo === "aborted" || codigo === "AbortError")
    return "A captura foi cancelada.";
  return "Não foi possível usar o microfone. Você pode continuar pelo campo de texto.";
}

const TOM: Record<
  CriterioAvaliado["desempenho"],
  { classe: string; emoji: string; rotulo: string }
> = {
  boa: {
    classe: "border-success/50 bg-success/10 text-success",
    emoji: "🟢",
    rotulo: "Boa",
  },
  parcial: {
    classe: "border-warning/50 bg-warning/10 text-warning",
    emoji: "🟡",
    rotulo: "Parcial",
  },
  ruim: {
    classe: "border-destructive/50 bg-destructive/10 text-destructive",
    emoji: "🔴",
    rotulo: "Ruim",
  },
};

function Criterios({ criterios }: { criterios: CriterioAvaliado[] }) {
  return (
    <div className="space-y-2">
      {criterios.map((c, i) => {
        const tom = TOM[c.desempenho];
        const peso = Number(c.peso ?? 1);
        const pontos = Number(
          c.pontos ??
            (c.desempenho === "boa"
              ? peso
              : c.desempenho === "parcial"
                ? peso / 2
                : 0),
        );
        return (
          <div key={i} className={`rounded-2xl border p-4 ${tom.classe}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                {c.criterio}
              </p>
              <span className="shrink-0 text-[11px] font-semibold">
                {tom.emoji} {tom.rotulo} · {pontos.toLocaleString("pt-BR")}/
                {peso.toLocaleString("pt-BR")}
              </span>
            </div>
            {c.comentario ? (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {c.comentario}
              </p>
            ) : null}
            <div className="mt-2 rounded-xl border border-current/20 bg-background/30 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide">
                Evidência na transcrição
              </p>
              {c.evidencias?.length ? (
                <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                  {c.evidencias.map((evidencia, indice) => (
                    <li key={indice}>“{evidencia}”</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Nenhuma evidência encontrada.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MensagemEstacao({ turno }: { turno: Turno }) {
  if (turno.papel === "user") {
    return (
      <div className="ml-auto max-w-[88%]">
        <p className="mb-1 text-right text-[9px] uppercase tracking-wide text-muted-foreground">
          {CANAIS[turno.canal].rotulo}
        </p>
        <div className="rounded-2xl rounded-br-md bg-[#9D4EDD] px-4 py-3 text-sm text-white shadow-[0_6px_20px_-8px_#9D4EDD]">
          {turno.texto}
        </div>
      </div>
    );
  }
  const exame = turno.canal === "exame";
  const avaliador = turno.canal === "avaliador";
  return (
    <div
      className={`flex max-w-[94%] items-end gap-2 ${
        exame || avaliador ? "mx-auto w-full" : ""
      }`}
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          exame
            ? "bg-warning/15 text-warning"
            : avaliador
              ? "bg-primary/15 text-primary"
              : "bg-[#2A2438] text-muted-foreground"
        }`}
      >
        {exame ? (
          <ClipboardList className="size-4" />
        ) : avaliador ? (
          <FileCheck2 className="size-4" />
        ) : (
          <User className="size-4" />
        )}
      </span>
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed text-foreground ${
          exame
            ? "border border-warning/30 bg-warning/10"
            : avaliador
              ? "border border-primary/30 bg-primary/10"
              : "rounded-bl-md bg-[#2A2438]"
        }`}
      >
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
          {exame ? "Resultado do exame" : avaliador ? "Avaliador" : "Paciente"}
        </p>
        {turno.texto}
      </div>
    </div>
  );
}

function Osce() {
  const { usuario } = useSessao();
  const qc = useQueryClient();
  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const sessoes = useQuery({
    queryKey: ["osce-sessoes"],
    queryFn: buscarSessoesOsce,
    enabled: !!usuario,
  });
  const metricas = metricasOsce(sessoes.data ?? []);

  const criarCaso = useServerFn(gerarCaso);
  const responder = useServerFn(falarComPaciente);
  const avaliar = useServerFn(avaliarEstacao);
  const consultarAudio = useServerFn(recursosAudioOsce);
  const consultarFixas = useServerFn(listarEstacoesFixasOsce);
  const transcrever = useServerFn(transcreverAudioOsce);
  const sintetizar = useServerFn(sintetizarFalaOsce);
  const recursosAudio = useQuery({
    queryKey: ["osce-recursos-audio"],
    queryFn: () => consultarAudio(),
  });
  const estacoesFixas = useQuery({
    queryKey: ["osce-estacoes-fixas"],
    queryFn: () => consultarFixas(),
  });

  const temasBanco = useMemo(
    () =>
      [...new Set((tax.data?.assuntos ?? []).map((a) => a.nome))]
        .filter((n) => n !== "Temas gerais")
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [tax.data],
  );

  const [etapa, setEtapa] = useState<Etapa>("config");
  const [temaLivre, setTemaLivre] = useState("");
  const [lote, setLote] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [minutos, setMinutos] = useState(10);
  const [cenario, setCenario] = useState<Cenario>("ambulatorio");
  const [dificuldade, setDificuldade] = useState<Dificuldade>("intermediario");
  const [estacaoFixaId, setEstacaoFixaId] = useState("");
  const [barema, setBarema] = useState("");
  const [vozLigada, setVozLigada] = useState(true);
  const [tema, setTema] = useState("");
  const [sessaoToken, setSessaoToken] = useState("");
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [texto, setTexto] = useState("");
  const [canal, setCanal] = useState<Canal>("paciente");
  const [restante, setRestante] = useState(0);
  const [fimEm, setFimEm] = useState(0);
  const [estadoMic, setEstadoMic] = useState<EstadoMic>("ocioso");
  const [statusMic, setStatusMic] = useState("");
  const [erroMic, setErroMic] = useState("");
  const [erroConversa, setErroConversa] = useState("");
  const [erroEncerrar, setErroEncerrar] = useState("");
  const [ultimaFalha, setUltimaFalha] = useState<Envio | null>(null);
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);

  const reconhecimento = useRef<any>(null);
  const gravador = useRef<MediaRecorder | null>(null);
  const fluxoMic = useRef<MediaStream | null>(null);
  const blocosAudio = useRef<Blob[]>([]);
  const audioAtual = useRef<HTMLAudioElement | null>(null);
  const perfilRef = useRef<PerfilPaciente | null>(null);
  const vozLigadaRef = useRef(true);

  function registrarFalha(
    tipo: string,
    contexto: Record<string, string | number | boolean | null> = {},
  ) {
    if (!usuario) return;
    void registrarEventoOsce({
      userId: usuario.id,
      tipo,
      contexto: {
        ...contexto,
        navegador:
          typeof navigator === "undefined"
            ? "desconhecido"
            : navigator.userAgent.slice(0, 300),
      },
    }).catch(() => undefined);
  }

  useEffect(() => {
    vozLigadaRef.current = vozLigada;
  }, [vozLigada]);

  useEffect(() => {
    if (etapa !== "estacao" || !fimEm) return;
    const atualizar = () =>
      setRestante(Math.max(0, Math.ceil((fimEm - Date.now()) / 1000)));
    atualizar();
    const id = window.setInterval(atualizar, 250);
    return () => window.clearInterval(id);
  }, [etapa, fimEm]);

  useEffect(() => {
    if (etapa === "estacao" && restante === 0 && fimEm) {
      reconhecimento.current?.abort?.();
      gravador.current?.state === "recording" && gravador.current.stop();
      fluxoMic.current?.getTracks().forEach((t) => t.stop());
      setEstadoMic("ocioso");
      audioAtual.current?.pause();
      window.speechSynthesis?.cancel();
    }
  }, [etapa, restante, fimEm]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const carregar = () => window.speechSynthesis.getVoices();
    carregar();
    window.speechSynthesis.addEventListener("voiceschanged", carregar);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", carregar);
  }, []);

  useEffect(
    () => () => {
      reconhecimento.current?.abort?.();
      if (gravador.current?.state === "recording") gravador.current.stop();
      fluxoMic.current?.getTracks().forEach((t) => t.stop());
      audioAtual.current?.pause();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );

  function pararVoz() {
    audioAtual.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  async function desbloquearAudio() {
    if (typeof window === "undefined") return;
    try {
      const audio = audioAtual.current ?? new Audio(AUDIO_SILENCIOSO);
      audioAtual.current = audio;
      audio.muted = true;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    } catch {
      registrarFalha("audio_desbloqueio_falhou", {
        ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
      });
    }
  }

  function alternarVoz() {
    const proxima = !vozLigada;
    setVozLigada(proxima);
    if (!proxima) pararVoz();
    else void desbloquearAudio();
  }

  function falarNavegador(txt: string, pessoa: PerfilPaciente) {
    if (
      !vozLigadaRef.current ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    )
      return;
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(txt.replace(/[*_#`]/g, ""));
    fala.lang = "pt-BR";
    const vozes = window.speechSynthesis.getVoices();
    const ptBr = vozes.filter((v) => /pt[-_]?BR/i.test(v.lang));
    const portugues = ptBr.length
      ? ptBr
      : vozes.filter((v) => /^pt/i.test(v.lang));
    const feminina =
      /female|mulher|maria|francisca|luciana|fernanda|camila|vit[oó]ria|joana|helo[ií]sa|let[ií]cia/i;
    const masculina =
      /male|homem|antonio|ant[oô]nio|daniel|ricardo|felipe|jo[aã]o|thiago|paulo/i;
    fala.voice =
      portugues.find((v) =>
        (pessoa.sexo === "feminino" ? feminina : masculina).test(v.name),
      ) ??
      portugues[0] ??
      null;
    fala.pitch = pessoa.sexo === "feminino" ? 1.04 : 0.96;
    fala.rate = pessoa.idade >= 65 ? 0.92 : pessoa.idade <= 17 ? 1.04 : 0.98;
    window.speechSynthesis.speak(fala);
  }

  async function falar(txt: string) {
    const pessoa = perfilRef.current;
    if (!vozLigadaRef.current || !pessoa) return;
    pararVoz();
    if (recursosAudio.data?.neural) {
      try {
        const r = await sintetizar({
          data: {
            texto: txt,
            sexo: pessoa.sexo,
            idade: pessoa.idade,
            emocao: pessoa.estadoEmocional,
          },
        });
        if (!vozLigadaRef.current) return;
        const normal = r.audioBase64.replace(/-/g, "+").replace(/_/g, "/");
        const audio = audioAtual.current ?? new Audio();
        audio.src = `data:${r.mimeType};base64,${normal + "=".repeat((4 - (normal.length % 4)) % 4)}`;
        audioAtual.current = audio;
        audio.load();
        await audio.play();
        return;
      } catch (erro) {
        registrarFalha("voz_neural_falhou", {
          erro: mensagemErro(erro, "erro desconhecido").slice(0, 250),
        });
        // O sintetizador do navegador mantém a estação utilizável sem credencial ou em falhas temporárias.
      }
    }
    falarNavegador(txt, pessoa);
  }

  async function obterMicrofone() {
    if (!navigator.mediaDevices?.getUserMedia)
      throw Object.assign(new Error(), { name: "NotFoundError" });
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  }

  async function testarMicrofone() {
    setErroMic("");
    setStatusMic("Solicitando permissão…");
    try {
      const stream = await obterMicrofone();
      stream.getTracks().forEach((t) => t.stop());
      setStatusMic("Microfone pronto para uso.");
    } catch (erro) {
      setStatusMic("");
      const codigo = (erro as { name?: string }).name;
      setErroMic(erroMicrofone(codigo));
      registrarFalha("microfone_teste_falhou", { codigo: codigo ?? null });
    }
  }

  function iniciarReconhecimento() {
    const SR =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setEstadoMic("ocioso");
      setErroMic(
        "Este navegador não oferece transcrição de voz. Continue pelo campo de texto.",
      );
      registrarFalha("reconhecimento_indisponivel");
      return;
    }
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (evento: any) => {
      let transcrito = "";
      let final = false;
      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        transcrito += evento.results[i][0].transcript;
        final ||= evento.results[i].isFinal;
      }
      setTexto(transcrito.trimStart());
      if (final) {
        setEstadoMic("pronto");
        setStatusMic("Transcrição pronta — revise o texto antes de enviar.");
      }
    };
    rec.onerror = (evento: any) => {
      setEstadoMic("ocioso");
      setStatusMic("");
      setErroMic(erroMicrofone(evento.error));
      registrarFalha("reconhecimento_falhou", {
        codigo: String(evento.error ?? "desconhecido"),
      });
    };
    rec.onend = () =>
      setEstadoMic((atual) => (atual === "pronto" ? atual : "ocioso"));
    reconhecimento.current = rec;
    rec.start();
    setEstadoMic("ouvindo");
    setStatusMic("Ouvindo… toque novamente para parar.");
  }

  async function blobBase64(blob: Blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binario = "";
    const passo = 0x8000;
    for (let i = 0; i < bytes.length; i += passo)
      binario += String.fromCharCode(...bytes.subarray(i, i + passo));
    return btoa(binario);
  }

  function iniciarGravacao(stream: MediaStream) {
    const tipos = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    const mimeType = tipos.find((t) => MediaRecorder.isTypeSupported(t));
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    blocosAudio.current = [];
    recorder.ondataavailable = (e) =>
      e.data.size && blocosAudio.current.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setEstadoMic("transcrevendo");
      setStatusMic("Transcrevendo sua fala…");
      try {
        const blob = new Blob(blocosAudio.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const r = await transcrever({
          data: { audioBase64: await blobBase64(blob), mimeType: blob.type },
        });
        setTexto(r.texto);
        setEstadoMic("pronto");
        setStatusMic("Transcrição pronta — revise o texto antes de enviar.");
      } catch (erro) {
        setEstadoMic("ocioso");
        setStatusMic("");
        setErroMic(
          mensagemErro(
            erro,
            "Não foi possível transcrever. Continue digitando.",
          ),
        );
        registrarFalha("transcricao_neural_falhou", {
          erro: mensagemErro(erro, "erro desconhecido").slice(0, 250),
        });
      }
    };
    gravador.current = recorder;
    recorder.start();
    setEstadoMic("ouvindo");
    setStatusMic("Gravando… toque novamente para parar e transcrever.");
  }

  async function alternarMicrofone() {
    if (estadoMic === "ouvindo") {
      reconhecimento.current?.stop?.();
      if (gravador.current?.state === "recording") gravador.current.stop();
      return;
    }
    if (
      estadoMic === "solicitando" ||
      estadoMic === "transcrevendo" ||
      restante === 0
    )
      return;
    setErroMic("");
    setEstadoMic("solicitando");
    setStatusMic("Solicitando acesso ao microfone…");
    try {
      const stream = await obterMicrofone();
      fluxoMic.current = stream;
      if (recursosAudio.data?.neural && typeof MediaRecorder !== "undefined")
        iniciarGravacao(stream);
      else {
        stream.getTracks().forEach((t) => t.stop());
        iniciarReconhecimento();
      }
    } catch (erro) {
      setEstadoMic("ocioso");
      setStatusMic("");
      const codigo = (erro as { name?: string }).name;
      setErroMic(erroMicrofone(codigo));
      registrarFalha("microfone_captura_falhou", { codigo: codigo ?? null });
    }
  }

  const iniciar = useMutation({
    mutationFn: async () => {
      const fixa = estacoesFixas.data?.find(
        (estacao) => estacao.id === estacaoFixaId,
      );
      const escolhido =
        fixa?.titulo ||
        temaLivre.trim() ||
        (lote.length
          ? lote[Math.floor(Math.random() * lote.length)]!
          : temasBanco.length
            ? temasBanco[Math.floor(Math.random() * temasBanco.length)]!
            : "Cefaleia tensional");
      return {
        escolhido,
        ...(await criarCaso({
          data: {
            tema: escolhido,
            cenario,
            dificuldade,
            ...(estacaoFixaId ? { estacaoId: estacaoFixaId } : {}),
          },
        })),
      };
    },
    onSuccess: ({
      escolhido,
      sessaoToken: token,
      apresentacao,
      cenario: cenarioCaso,
    }) => {
      setTema(escolhido);
      setCenario(cenarioCaso);
      setSessaoToken(token);
      setPerfil(apresentacao);
      perfilRef.current = apresentacao;
      setTurnos([
        {
          papel: "assistant",
          texto: apresentacao.queixa,
          canal: "paciente",
        },
      ]);
      setCanal("paciente");
      setTexto("");
      setAvaliacao(null);
      setErroConversa("");
      const fim = Date.now() + minutos * 60 * 1000;
      setFimEm(fim);
      setRestante(minutos * 60);
      setEtapa("estacao");
      void falar(apresentacao.queixa);
    },
    onError: (erro) =>
      registrarFalha("criacao_estacao_falhou", {
        erro: mensagemErro(erro, "erro desconhecido").slice(0, 250),
      }),
  });

  const enviar = useMutation({
    mutationFn: async (envio: Envio) =>
      await responder({
        data: {
          sessaoToken,
          historico: envio.historico.slice(-30),
          fala: envio.fala,
          canal: envio.canal,
        },
      }),
    onSuccess: (resposta) => {
      setTurnos((t) => [
        ...t,
        {
          papel: "assistant",
          texto: resposta.fala,
          canal: resposta.canal,
        },
      ]);
      setErroConversa("");
      setUltimaFalha(null);
      if (resposta.canal === "paciente") void falar(resposta.fala);
    },
    onError: (erro, envio) => {
      setErroConversa(
        mensagemErro(
          erro,
          "Não foi possível concluir esta interação. Tente novamente.",
        ),
      );
      setUltimaFalha(envio);
      registrarFalha("interacao_falhou", {
        canal: envio.canal,
        erro: mensagemErro(erro, "erro desconhecido").slice(0, 250),
      });
    },
  });

  function submeter(fala: string) {
    const limpo = fala.trim();
    if (!limpo || enviar.isPending || restante === 0) return;
    const historico = [
      ...turnos,
      { papel: "user" as const, texto: limpo, canal },
    ];
    setTurnos(historico);
    setTexto("");
    setEstadoMic("ocioso");
    setStatusMic("");
    setErroConversa("");
    setUltimaFalha(null);
    enviar.mutate({ fala: limpo, historico, canal });
  }

  const encerrar = useMutation({
    mutationFn: async () => {
      const duracaoSegundos = Math.min(
        minutos * 60,
        Math.max(0, minutos * 60 - restante),
      );
      const resultado = await avaliar({
        data: {
          sessaoToken,
          historico: turnos.slice(-50),
          ...(barema.trim() ? { barema } : {}),
          duracaoSegundos,
        },
      });
      if (usuario)
        await salvarSessaoOsce({
          userId: usuario.id,
          tema: tema || "Estação",
          cenario,
          minutos,
          duracaoSegundos,
          nota: resultado.nota,
          criterios: resultado.criterios,
          correcao: resultado.correcao,
          ...(barema.trim() ? { barema } : {}),
          caso: resultado.casoParaHistorico,
          transcricao: turnos,
        });
      return resultado;
    },
    onSuccess: (r) => {
      pararVoz();
      setAvaliacao(r);
      setEtapa("relatorio");
      setErroEncerrar("");
      void qc.invalidateQueries({ queryKey: ["osce-sessoes"] });
    },
    onError: (erro) => {
      setErroEncerrar(
        mensagemErro(
          erro,
          "Não foi possível corrigir a estação. Tente novamente.",
        ),
      );
      registrarFalha("avaliacao_falhou", {
        erro: mensagemErro(erro, "erro desconhecido").slice(0, 250),
      });
    },
  });

  const temasFiltrados = temasBanco
    .filter((t) => t.toLowerCase().includes(busca.toLowerCase()))
    .slice(0, 60);
  const micOcupado =
    estadoMic === "solicitando" || estadoMic === "transcrevendo";

  return (
    <AppShell
      titulo="OSCE AZ"
      {...(etapa === "config"
        ? {
            descricao:
              "Simulação prática com paciente de IA, voz, cronômetro e correção por barema.",
          }
        : {})}
    >
      {etapa === "config" || etapa === "historico" ? (
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-full border border-border/60 bg-surface p-1">
          <button
            onClick={() => setEtapa("config")}
            className={`rounded-full py-2 text-xs font-semibold ${etapa === "config" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Nova estação
          </button>
          <button
            onClick={() => setEtapa("historico")}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold ${etapa === "historico" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <History className="size-3.5" />
            Histórico
          </button>
        </div>
      ) : null}

      {etapa === "config" ? (
        <div className="space-y-5">
          <section className="grid grid-cols-3 gap-2">
            <Metrica rotulo="Sessões" valor={`${metricas.total}`} />
            <Metrica
              rotulo="Média geral"
              valor={metricas.total ? metricas.media.toFixed(1) : "—"}
            />
            <Metrica
              rotulo="Melhor"
              valor={
                metricas.total ? `${Math.round(metricas.melhor * 10)}%` : "—"
              }
              tom="success"
            />
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold">
              Cenário clínico
            </h2>
            <div className="mt-3 grid gap-2">
              <CenarioBotao
                ativo={cenario === "emergencia"}
                onClick={() => setCenario("emergencia")}
                icone={<Ambulance className="size-4" />}
                titulo="Emergência / Pronto-socorro"
                texto="Anamnese focada, ABCDE e estabilização."
              />
              <CenarioBotao
                ativo={cenario === "ambulatorio"}
                onClick={() => setCenario("ambulatorio")}
                icone={<Stethoscope className="size-4" />}
                titulo="Ambulatório / UBS"
                texto="Anamnese completa, contexto e prevenção."
              />
            </div>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              <h2 className="font-display text-base font-semibold">
                Nível de dificuldade
              </h2>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  ["basico", "Básico"],
                  ["intermediario", "Intermediário"],
                  ["avancado", "Avançado"],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  aria-pressed={dificuldade === valor}
                  onClick={() => {
                    setDificuldade(valor);
                    setEstacaoFixaId("");
                  }}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-semibold ${
                    dificuldade === valor && !estacaoFixaId
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 text-muted-foreground"
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              No avançado, o paciente pode ser pouco colaborativo, ansioso ou
              instável.
            </p>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2">
              <Library className="size-4 text-primary" />
              <h2 className="font-display text-base font-semibold">
                Biblioteca de estações
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Casos fixos permitem repetir a mesma estação e comparar sua
              evolução.
            </p>
            <button
              aria-pressed={!estacaoFixaId}
              onClick={() => setEstacaoFixaId("")}
              className={`mt-3 w-full rounded-xl border p-3 text-left text-xs font-semibold ${
                !estacaoFixaId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70"
              }`}
            >
              Gerar um caso novo por IA
            </button>
            <div className="mt-2 grid gap-2">
              {(estacoesFixas.data ?? []).map((estacao) => (
                <button
                  key={estacao.id}
                  aria-pressed={estacaoFixaId === estacao.id}
                  onClick={() => {
                    setEstacaoFixaId(estacao.id);
                    setCenario(estacao.cenario);
                    setDificuldade(estacao.dificuldade);
                  }}
                  className={`rounded-xl border p-3 text-left ${
                    estacaoFixaId === estacao.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">
                      {estacao.titulo}
                    </span>
                    <span className="rounded-full bg-surface px-2 py-1 text-[9px] uppercase text-muted-foreground">
                      {estacao.dificuldade}
                    </span>
                  </span>
                  <span className="mt-1 block text-[10px] text-primary">
                    {estacao.area}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                    {estacao.resumo}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold">
              Tema da estação
            </h2>
            <label htmlFor="tema-osce" className="sr-only">
              Tema livre
            </label>
            <input
              id="tema-osce"
              value={temaLivre}
              onChange={(e) => {
                setTemaLivre(e.target.value);
                setEstacaoFixaId("");
              }}
              disabled={Boolean(estacaoFixaId)}
              placeholder="Ex.: vaginose bacteriana"
              className="mt-3 w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-50"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Deixe em branco para sorteio. Marque temas abaixo para criar um
              lote{lote.length ? ` (${lote.length} marcados)` : ""}.
            </p>
            <label htmlFor="busca-osce" className="sr-only">
              Buscar tema
            </label>
            <input
              id="busca-osce"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar tema"
              className="mt-3 w-full rounded-xl border border-border/70 bg-surface px-4 py-2.5 text-xs outline-none focus:border-primary"
            />
            <div className="mt-3 flex max-h-52 flex-wrap gap-2 overflow-y-auto">
              {temasFiltrados.map((t) => {
                const ativo = lote.includes(t);
                return (
                  <button
                    key={t}
                    aria-pressed={ativo}
                    onClick={() => {
                      setEstacaoFixaId("");
                      setLote((l) =>
                        ativo ? l.filter((x) => x !== t) : [...l, t],
                      );
                    }}
                    className={`rounded-full px-3 py-1.5 text-[11px] ${ativo ? "bg-primary font-medium text-primary-foreground" : "border border-border/70 text-muted-foreground"}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold">
              Tempo da estação
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TEMPOS.map((t) => (
                <button
                  key={t}
                  aria-pressed={minutos === t}
                  onClick={() => setMinutos(t)}
                  className={`rounded-full px-4 py-2 text-xs font-medium ${minutos === t ? "bg-primary text-primary-foreground" : "border border-border/70 text-muted-foreground"}`}
                >
                  {t} min
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold">
              Barema e áudio
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Cole o checklist da banca. Sem barema, usamos o padrão completo.
            </p>
            <label htmlFor="barema-osce" className="sr-only">
              Barema personalizado
            </label>
            <textarea
              id="barema-osce"
              value={barema}
              onChange={(e) => setBarema(e.target.value)}
              rows={5}
              placeholder="1. Apresenta-se e identifica o paciente (0,5)…"
              className="mt-3 w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-xs outline-none focus:border-primary"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface p-3">
              <div>
                <p className="text-xs font-semibold">Voz do paciente</p>
                <p className="text-[11px] text-muted-foreground">
                  Voz gerada por IA · você pode mutar quando quiser.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={vozLigada}
                aria-label={vozLigada ? "Mutar voz da IA" : "Ativar voz da IA"}
                onClick={alternarVoz}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${vozLigada ? "bg-primary text-primary-foreground" : "border border-border/70 text-muted-foreground"}`}
              >
                {vozLigada ? (
                  <Volume2 className="size-4" />
                ) : (
                  <VolumeX className="size-4" />
                )}
                {vozLigada ? "Voz ativa" : "Voz mutada"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => void testarMicrofone()}
              disabled={
                Boolean(statusMic) &&
                !erroMic &&
                statusMic.includes("Solicitando")
              }
              className="mt-3 flex items-center gap-2 rounded-full border border-border/70 px-3 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <Mic className="size-4" />
              Testar microfone
            </button>
            {statusMic ? (
              <p
                role="status"
                className="mt-2 flex items-center gap-1.5 text-xs text-success"
              >
                <CheckCircle2 className="size-3.5" />
                {statusMic}
              </p>
            ) : null}
            {erroMic ? (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {erroMic}
              </p>
            ) : null}
          </section>
          <button
            onClick={() => {
              void desbloquearAudio();
              iniciar.mutate();
            }}
            disabled={iniciar.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {iniciar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : temaLivre.trim() ? (
              <Play className="size-4" />
            ) : (
              <Shuffle className="size-4" />
            )}
            Iniciar estação
          </button>
          {iniciar.isError ? (
            <p role="alert" className="text-xs text-destructive">
              {mensagemErro(
                iniciar.error,
                "Não foi possível montar o caso. Tente novamente.",
              )}
            </p>
          ) : null}
        </div>
      ) : null}

      {etapa === "historico" ? (
        <div className="space-y-3">
          {(sessoes.data ?? []).map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-border/60 bg-card p-4"
            >
              <button
                onClick={() => setAberta((a) => (a === s.id ? null : s.id))}
                aria-expanded={aberta === s.id}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">{s.tema}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")} ·{" "}
                    {s.cenario === "emergencia" ? "Emergência" : "Ambulatório"}{" "}
                    · {formatar(s.duracao_segundos)}
                  </p>
                </div>
                <span
                  className={`font-display text-lg font-semibold ${s.nota >= 7 ? "text-success" : s.nota >= 5 ? "text-warning" : "text-destructive"}`}
                >
                  {s.nota.toFixed(1)}
                </span>
              </button>
              {aberta === s.id ? (
                <div className="mt-4 space-y-3">
                  <Criterios criterios={s.criterios} />
                  {s.correcao ? (
                    <p className="whitespace-pre-wrap rounded-xl border border-border/60 bg-surface p-4 text-xs leading-relaxed">
                      {s.correcao}
                    </p>
                  ) : null}
                  {s.transcricao?.length ? (
                    <details className="rounded-xl border border-border/60 bg-surface p-4 text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Transcrição da estação
                      </summary>
                      <div className="mt-3 space-y-2">
                        {s.transcricao.map((t, i) => {
                          const canalHistorico = t.canal ?? "paciente";
                          const origem =
                            t.papel === "user"
                              ? `Candidato · ${CANAIS[canalHistorico].curto}`
                              : canalHistorico === "paciente"
                                ? "Paciente"
                                : canalHistorico === "exame"
                                  ? "Resultado do exame"
                                  : "Avaliador";
                          return (
                            <p key={i}>
                              <strong>{origem}:</strong> {t.texto}
                            </p>
                          );
                        })}
                      </div>
                    </details>
                  ) : null}
                  {s.barema ? (
                    <details className="rounded-xl border border-border/60 bg-surface p-4 text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Barema utilizado
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap">{s.barema}</p>
                    </details>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
          {sessoes.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando histórico…
            </p>
          ) : null}
          {sessoes.isError ? (
            <p role="alert" className="text-sm text-destructive">
              Não foi possível carregar o histórico.
            </p>
          ) : null}
          {sessoes.data && !sessoes.data.length ? (
            <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
              Nenhuma simulação registrada ainda.
            </p>
          ) : null}
        </div>
      ) : null}

      {etapa === "estacao" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3">
            <span className="flex items-center gap-2 text-sm">
              {cenario === "emergencia" ? (
                <Ambulance className="size-4 text-destructive" />
              ) : (
                <Stethoscope className="size-4 text-primary" />
              )}
              {cenario === "emergencia" ? "Pronto-socorro" : "Ambulatório"}
              {perfil ? ` · ${perfil.nome}, ${perfil.idade} anos` : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={alternarVoz}
                aria-pressed={!vozLigada}
                aria-label={
                  vozLigada ? "Mutar voz da IA" : "Desmutar voz da IA"
                }
                title={vozLigada ? "Mutar voz da IA" : "Desmutar voz da IA"}
                className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground"
              >
                {vozLigada ? (
                  <Volume2 className="size-4" />
                ) : (
                  <VolumeX className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {vozLigada ? "Mutar" : "Desmutar"}
                </span>
              </button>
              <span
                className={`font-display text-lg font-semibold tabular-nums ${restante <= 60 ? "text-destructive" : "text-primary"}`}
              >
                {formatar(restante)}
              </span>
            </div>
          </div>
          <p className="-mt-2 text-right text-[10px] text-muted-foreground">
            Voz gerada por IA
          </p>
          {restante === 0 ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive"
            >
              Tempo esgotado. Microfone e novas mensagens foram bloqueados;
              encerre para receber a correção.
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border/60 bg-surface p-1">
            {(
              [
                ["paciente", MessageCircle],
                ["exame", ClipboardList],
                ["avaliador", FileCheck2],
              ] as const
            ).map(([valor, Icone]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={canal === valor}
                onClick={() => {
                  setCanal(valor);
                  setTexto("");
                  setErroConversa("");
                }}
                disabled={enviar.isPending || restante === 0}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold disabled:opacity-50 ${
                  canal === valor
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Icone className="size-4" />
                <span className="truncate">{CANAIS[valor].curto}</span>
              </button>
            ))}
          </div>
          <p className="-mt-2 text-center text-[11px] text-muted-foreground">
            {CANAIS[canal].rotulo}
          </p>
          <div className="space-y-3" aria-live="polite">
            {turnos.map((turno, indice) => (
              <MensagemEstacao key={indice} turno={turno} />
            ))}
            {enviar.isPending ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {canal === "paciente"
                  ? "O paciente está respondendo…"
                  : canal === "exame"
                    ? "O avaliador está fornecendo o resultado…"
                    : "Registrando sua conclusão…"}
              </p>
            ) : null}
          </div>
          {statusMic ? (
            <p role="status" className="text-xs text-muted-foreground">
              {statusMic}
            </p>
          ) : null}
          {erroMic ? (
            <p role="alert" className="text-xs text-destructive">
              {erroMic}
            </p>
          ) : null}
          {erroConversa ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive"
            >
              <span>{erroConversa}</span>
              {ultimaFalha ? (
                <button
                  onClick={() => enviar.mutate(ultimaFalha)}
                  disabled={enviar.isPending || restante === 0}
                  className="flex items-center gap-1 font-semibold underline disabled:opacity-60"
                >
                  <RotateCcw className="size-3.5" />
                  Tentar novamente
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="flex gap-2 rounded-2xl border border-border/70 bg-surface p-1.5">
            <button
              type="button"
              onClick={() => void alternarMicrofone()}
              disabled={micOcupado || enviar.isPending || restante === 0}
              aria-label={
                estadoMic === "ouvindo"
                  ? "Parar gravação"
                  : `Usar microfone em: ${CANAIS[canal].rotulo}`
              }
              aria-pressed={estadoMic === "ouvindo"}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full disabled:opacity-50 ${estadoMic === "ouvindo" ? "bg-destructive text-white" : "bg-primary/20 text-primary"}`}
            >
              {micOcupado ? (
                <Loader2 className="size-4 animate-spin" />
              ) : estadoMic === "ouvindo" ? (
                <MicOff className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </button>
            <label htmlFor="fala-osce" className="sr-only">
              {CANAIS[canal].rotulo}
            </label>
            <input
              id="fala-osce"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submeter(texto)}
              disabled={enviar.isPending || restante === 0}
              placeholder={CANAIS[canal].placeholder}
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => submeter(texto)}
              disabled={!texto.trim() || enviar.isPending || restante === 0}
              aria-label="Enviar mensagem"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
          <button
            onClick={() => {
              reconhecimento.current?.abort?.();
              if (gravador.current?.state === "recording")
                gravador.current.stop();
              pararVoz();
              encerrar.mutate();
            }}
            disabled={encerrar.isPending || enviar.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border/70 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {encerrar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Square className="size-4" />
            )}
            Encerrar e corrigir
          </button>
          {erroEncerrar ? (
            <p role="alert" className="text-xs text-destructive">
              {erroEncerrar}
            </p>
          ) : null}
        </div>
      ) : null}

      {etapa === "relatorio" && avaliacao ? (
        <div className="space-y-4">
          <section className="rounded-3xl border border-primary/40 bg-card p-5 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Nota final
            </p>
            <p
              className={`font-display text-5xl font-semibold ${avaliacao.nota >= 7 ? "text-success" : avaliacao.nota >= 5 ? "text-warning" : "text-destructive"}`}
            >
              {avaliacao.nota.toFixed(1)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {avaliacao.criterios.length} critérios · cálculo ponderado pelo
              barema
            </p>
          </section>
          <Criterios criterios={avaliacao.criterios} />
          {avaliacao.correcao ? (
            <article className="whitespace-pre-wrap rounded-2xl border border-border/60 bg-card p-5 text-sm leading-relaxed">
              {avaliacao.correcao}
            </article>
          ) : null}
          <button
            onClick={() => {
              setEtapa("config");
              setTurnos([]);
              setSessaoToken("");
              setPerfil(null);
              perfilRef.current = null;
              setAvaliacao(null);
              setFimEm(0);
            }}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Nova estação
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}

function Metrica({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: string;
  tom?: "success";
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 text-center">
      <p
        className={`font-display text-xl font-semibold ${tom === "success" ? "text-success" : "text-primary"}`}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
    </div>
  );
}

function CenarioBotao({
  ativo,
  onClick,
  icone,
  titulo,
  texto,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={`flex items-start gap-3 rounded-xl border p-3 text-left ${ativo ? "border-primary bg-primary/10" : "border-border/70"}`}
    >
      <span
        className={`mt-0.5 ${ativo ? "text-primary" : "text-muted-foreground"}`}
      >
        {icone}
      </span>
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
          {texto}
        </span>
      </span>
    </button>
  );
}
