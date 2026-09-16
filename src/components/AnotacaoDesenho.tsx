import { useEffect, useRef, useState } from "react";
import { Eraser, Highlighter, PenTool, Pencil, Redo2, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Ponto = { x: number; y: number };
type Ferramenta = "caneta" | "marcaTexto" | "borracha";
type Traco = { pontos: Ponto[]; cor: string; largura: number; modo: Ferramenta };
type Historico = { tracos: Traco[]; desfeitos: Traco[] };

const CORES: string[] = ["#111827", "#2563eb", "#16a34a", "#f59e0b", "#dc2626"];
const TAMANHO_BOTAO = 48;
const MARGEM_TELA = 12;
const CHAVE_POSICAO_BOTAO = "residenciapro:posicao-botao-desenho";

function limitarPosicaoNaTela(posicao: Ponto): Ponto {
  return {
    x: Math.min(
      Math.max(MARGEM_TELA, posicao.x),
      Math.max(MARGEM_TELA, window.innerWidth - TAMANHO_BOTAO - MARGEM_TELA),
    ),
    y: Math.min(
      Math.max(MARGEM_TELA, posicao.y),
      Math.max(MARGEM_TELA, window.innerHeight - TAMANHO_BOTAO - MARGEM_TELA),
    ),
  };
}

/**
 * Camada de desenho livre por cima do elemento apontado por `alvoRef`.
 * Fica escondida atrás de um botão redondo flutuante; ao abrir, mostra uma
 * barra com caneta, marca-texto, borracha, desfazer/refazer e cores.
 */
export function AnotacaoDesenho({ alvoRef }: { alvoRef: React.RefObject<HTMLElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aberto, setAberto] = useState(false);
  const [ferramenta, setFerramenta] = useState<Ferramenta>("marcaTexto");
  const [cor, setCor] = useState<string>(CORES[3] ?? "#f59e0b");
  const [historico, setHistorico] = useState<Historico>({ tracos: [], desfeitos: [] });
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });
  const desenhando = useRef(false);
  const tracoAtual = useRef<Traco | null>(null);
  const [posicaoBotao, setPosicaoBotao] = useState<Ponto | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const arrastoBotao = useRef<{
    pointerId: number;
    inicioX: number;
    inicioY: number;
    origem: Ponto;
    arrastou: boolean;
  } | null>(null);
  const ignorarProximoClique = useRef(false);

  const { tracos, desfeitos } = historico;

  useEffect(() => {
    function medir() {
      const alvo = alvoRef.current;
      if (!alvo) return;
      setTamanho({ w: alvo.scrollWidth, h: alvo.scrollHeight });
    }
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [alvoRef]);

  useEffect(() => {
    function atualizarPosicao() {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      setPosicaoBotao((atual) => {
        let base = atual;
        if (!base) {
          try {
            const salva = JSON.parse(localStorage.getItem(CHAVE_POSICAO_BOTAO) ?? "null") as Ponto | null;
            if (salva && Number.isFinite(salva.x) && Number.isFinite(salva.y)) base = salva;
          } catch {
            // Se a posição salva estiver inválida, volta ao canto inferior direito.
          }
        }
        return limitarPosicaoNaTela(
          base ?? { x: window.innerWidth - TAMANHO_BOTAO - 16, y: window.innerHeight - TAMANHO_BOTAO - 96 },
        );
      });
    }

    atualizarPosicao();
    window.addEventListener("resize", atualizarPosicao);
    return () => window.removeEventListener("resize", atualizarPosicao);
  }, []);

  useEffect(() => {
    redesenhar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracos, tamanho]);

  function desenharTraco(ctx: CanvasRenderingContext2D, t: Traco | null | undefined) {
    if (!t || !t.pontos || t.pontos.length < 2) return;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = t.largura;
    if (t.modo === "borracha") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = t.modo === "marcaTexto" ? 0.35 : 1;
      ctx.strokeStyle = t.cor;
    }
    ctx.beginPath();
    const inicio = t.pontos[0]!;
    ctx.moveTo(inicio.x, inicio.y);
    for (const p of t.pontos.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  function redesenhar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const t of tracos) {
      if (t) desenharTraco(ctx, t);
    }
  }

  function pontoRelativo(e: React.PointerEvent<HTMLCanvasElement>): Ponto {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function aoPressionar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!aberto) return;
    canvasRef.current?.setPointerCapture(e.pointerId);
    desenhando.current = true;
    const largura = ferramenta === "marcaTexto" ? 18 : ferramenta === "borracha" ? 24 : 2.5;
    tracoAtual.current = { pontos: [pontoRelativo(e)], cor, largura, modo: ferramenta };
  }

  function aoMover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current || !tracoAtual.current) return;
    tracoAtual.current.pontos.push(pontoRelativo(e));
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) desenharTraco(ctx, tracoAtual.current);
  }

  function aoSoltar() {
    if (!desenhando.current || !tracoAtual.current) return;
    desenhando.current = false;
    const novoTraco = tracoAtual.current;
    tracoAtual.current = null;
    if (novoTraco.pontos.length < 2) return;
    setHistorico((h) => ({ tracos: [...h.tracos, novoTraco], desfeitos: [] }));
  }

  function desfazer() {
    setHistorico((h) => {
      const ultimo = h.tracos[h.tracos.length - 1];
      if (!ultimo) return h;
      return { tracos: h.tracos.slice(0, -1), desfeitos: [...h.desfeitos, ultimo] };
    });
  }

  function refazer() {
    setHistorico((h) => {
      const ultimo = h.desfeitos[h.desfeitos.length - 1];
      if (!ultimo) return h;
      return { tracos: [...h.tracos, ultimo], desfeitos: h.desfeitos.slice(0, -1) };
    });
  }

  function iniciarArrastoBotao(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastoBotao.current = {
      pointerId: e.pointerId,
      inicioX: e.clientX,
      inicioY: e.clientY,
      origem: { x: rect.left, y: rect.top },
      arrastou: false,
    };
  }

  function moverBotao(e: React.PointerEvent<HTMLButtonElement>) {
    const arrasto = arrastoBotao.current;
    if (!arrasto || arrasto.pointerId !== e.pointerId) return;
    const deltaX = e.clientX - arrasto.inicioX;
    const deltaY = e.clientY - arrasto.inicioY;
    if (!arrasto.arrastou && Math.hypot(deltaX, deltaY) < 5) return;
    arrasto.arrastou = true;
    e.preventDefault();
    setPosicaoBotao(limitarPosicaoNaTela({ x: arrasto.origem.x + deltaX, y: arrasto.origem.y + deltaY }));
  }

  function finalizarArrastoBotao(e: React.PointerEvent<HTMLButtonElement>) {
    const arrasto = arrastoBotao.current;
    if (!arrasto || arrasto.pointerId !== e.pointerId) return;
    const posicaoFinal = limitarPosicaoNaTela({
      x: arrasto.origem.x + e.clientX - arrasto.inicioX,
      y: arrasto.origem.y + e.clientY - arrasto.inicioY,
    });
    if (arrasto.arrastou) {
      setPosicaoBotao(posicaoFinal);
      ignorarProximoClique.current = true;
      try {
        localStorage.setItem(CHAVE_POSICAO_BOTAO, JSON.stringify(posicaoFinal));
      } catch {
        // O botão continua funcionando mesmo se o navegador bloquear o armazenamento local.
      }
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    arrastoBotao.current = null;
  }

  function cancelarArrastoBotao(e: React.PointerEvent<HTMLButtonElement>) {
    const arrasto = arrastoBotao.current;
    if (!arrasto || arrasto.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    arrastoBotao.current = null;
    ignorarProximoClique.current = false;
  }

  function alternarPainel() {
    if (ignorarProximoClique.current) {
      ignorarProximoClique.current = false;
      return;
    }
    setAberto((valor) => !valor);
  }

  const barraAbaixo = !!posicaoBotao && posicaoBotao.y < 88;
  const barraPelaEsquerda = !!posicaoBotao && posicaoBotao.x < viewport.w / 2;

  return (
    <>
      <canvas
        ref={canvasRef}
        width={tamanho.w}
        height={tamanho.h}
        style={{ width: tamanho.w, height: tamanho.h }}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerLeave={aoSoltar}
        className={cn(
          "absolute left-0 top-0 z-20 touch-none",
          aberto ? "pointer-events-auto" : "pointer-events-none",
        )}
      />

      <div
        className="fixed z-30"
        style={posicaoBotao ? { left: posicaoBotao.x, top: posicaoBotao.y } : { bottom: 96, right: 16 }}
      >
        {aberto ? (
          <div
            className={cn(
              "absolute z-10 flex w-max max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-1 rounded-2xl border border-border/60 bg-card p-1.5 shadow-xl",
              barraAbaixo ? "top-[calc(100%+0.5rem)]" : "bottom-[calc(100%+0.5rem)]",
              barraPelaEsquerda ? "left-0" : "right-0",
            )}
          >
            <button onClick={desfazer} disabled={!tracos.length} className="rounded-full p-2 text-muted-foreground disabled:opacity-30">
              <Undo2 className="size-4" />
            </button>
            <button onClick={refazer} disabled={!desfeitos.length} className="rounded-full p-2 text-muted-foreground disabled:opacity-30">
              <Redo2 className="size-4" />
            </button>
            <span className="mx-0.5 h-5 w-px bg-border" />
            <button
              onClick={() => setFerramenta("caneta")}
              className={cn("rounded-full p-2", ferramenta === "caneta" ? "bg-primary/15 text-primary" : "text-muted-foreground")}
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => setFerramenta("marcaTexto")}
              className={cn("rounded-full p-2", ferramenta === "marcaTexto" ? "bg-primary/15 text-primary" : "text-muted-foreground")}
            >
              <Highlighter className="size-4" />
            </button>
            <button
              onClick={() => setFerramenta("borracha")}
              className={cn("rounded-full p-2", ferramenta === "borracha" ? "bg-primary/15 text-primary" : "text-muted-foreground")}
            >
              <Eraser className="size-4" />
            </button>
            <span className="mx-0.5 h-5 w-px bg-border" />
            {CORES.map((c) => (
              <button
                key={c}
                onClick={() => setCor(c)}
                style={{ backgroundColor: c }}
                className={cn("size-5 rounded-full border-2", cor === c ? "border-foreground" : "border-transparent")}
              />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onPointerDown={iniciarArrastoBotao}
          onPointerMove={moverBotao}
          onPointerUp={finalizarArrastoBotao}
          onPointerCancel={cancelarArrastoBotao}
          onClick={alternarPainel}
          aria-label={aberto ? "Fechar ferramentas de desenho" : "Abrir ou mover ferramentas de desenho"}
          title="Clique para abrir ou arraste para mover"
          className="flex size-12 touch-none cursor-grab select-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl active:cursor-grabbing"
        >
          {aberto ? <X className="size-5" /> : <PenTool className="size-5" />}
        </button>
      </div>
    </>
  );
}
