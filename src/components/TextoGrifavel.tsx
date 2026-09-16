import { useRef, useState } from "react";

export type Grifo = { inicio: number; fim: number };

function unirGrifos(grifos: Grifo[]): Grifo[] {
  const ordenados = [...grifos].sort((a, b) => a.inicio - b.inicio);
  const resultado: Grifo[] = [];
  for (const g of ordenados) {
    const ultimo = resultado[resultado.length - 1];
    if (ultimo && g.inicio <= ultimo.fim) {
      ultimo.fim = Math.max(ultimo.fim, g.fim);
    } else {
      resultado.push({ ...g });
    }
  }
  return resultado;
}

/**
 * Mostra o enunciado da questão. Selecionar um trecho (mouse no computador,
 * dedo/caneta no tablet) grifa automaticamente ao soltar. Tocar num trecho
 * já grifado mostra um botão pra excluir aquele grifo.
 */
export function TextoGrifavel({
  texto,
  grifos,
  onGrifosChange,
}: {
  texto: string;
  grifos: Grifo[];
  onGrifosChange: (grifos: Grifo[]) => void;
}) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [remover, setRemover] = useState<{ x: number; y: number; grifo: Grifo } | null>(null);

  function offsetDoPonto(node: Node, nodeOffset: number) {
    const el = containerRef.current;
    if (!el) return 0;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.setEnd(node, nodeOffset);
    return range.toString().length;
  }

  function aoSoltarSelecao() {
    const sel = window.getSelection();
    const el = containerRef.current;
    if (!sel || !el || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    const a = offsetDoPonto(range.startContainer, range.startOffset);
    const b = offsetDoPonto(range.endContainer, range.endOffset);
    const inicio = Math.min(a, b);
    const fim = Math.max(a, b);
    if (fim <= inicio) return;
    onGrifosChange(unirGrifos([...grifos, { inicio, fim }]));
    window.getSelection()?.removeAllRanges();
    setRemover(null);
  }

  function aoTocarGrifo(e: React.MouseEvent, g: Grifo) {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setRemover({ x: rect.left - elRect.left + rect.width / 2, y: rect.top - elRect.top, grifo: g });
  }

  function confirmarRemover(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!remover) return;
    onGrifosChange(
      grifos.filter((g) => g.inicio !== remover.grifo.inicio || g.fim !== remover.grifo.fim),
    );
    setRemover(null);
  }

  const ordenados = unirGrifos(grifos);
  const partes: { texto: string; grifo: Grifo | null }[] = [];
  let cursor = 0;
  for (const g of ordenados) {
    if (g.inicio > cursor) partes.push({ texto: texto.slice(cursor, g.inicio), grifo: null });
    partes.push({ texto: texto.slice(g.inicio, g.fim), grifo: g });
    cursor = g.fim;
  }
  if (cursor < texto.length) partes.push({ texto: texto.slice(cursor), grifo: null });

  return (
    <div className="relative">
      <p
        ref={containerRef}
        onMouseUp={aoSoltarSelecao}
        onTouchEnd={aoSoltarSelecao}
        onClick={() => setRemover(null)}
        className="mt-3 select-text text-sm font-medium leading-relaxed text-foreground"
      >
        {partes.map((parte, i) =>
          parte.grifo ? (
            <mark
              key={i}
              onClick={(e) => aoTocarGrifo(e, parte.grifo!)}
              className="cursor-pointer rounded bg-amber-300/70 px-0.5 text-foreground"
            >
              {parte.texto}
            </mark>
          ) : (
            <span key={i}>{parte.texto}</span>
          ),
        )}
      </p>

      {remover ? (
        <button
          type="button"
          onClick={confirmarRemover}
          style={{ left: remover.x, top: remover.y }}
          className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-lg"
        >
          Excluir grifo
        </button>
      ) : null}
    </div>
  );
}
