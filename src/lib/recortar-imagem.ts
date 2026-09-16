/** Recorta uma imagem no navegador e devolve um Blob JPEG/PNG pronto para upload. */
export type AreaRecorte = { x: number; y: number; width: number; height: number };

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem para recorte."));
    img.src = src;
  });
}

export async function recortarImagem(src: string, area: AreaRecorte): Promise<Blob> {
  const img = await carregarImagem(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não suporta recorte de imagem.");
  ctx.drawImage(
    img,
    Math.round(area.x),
    Math.round(area.y),
    Math.round(area.width),
    Math.round(area.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem recortada."))),
      "image/jpeg",
      0.92,
    );
  });
}
