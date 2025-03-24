import { TextElement } from "@/types/types";

export function drawText(ctx: CanvasRenderingContext2D, element: TextElement) {
  const { x1, y1, text, color, fontSize, fontFamily, breaks } = element;

  ctx.textBaseline = "top";
  ctx.textRendering = "geometricPrecision";
  ctx.fillStyle = color as string;
  if (element.opacity) {
    ctx.globalAlpha = element.opacity;
  }
  ctx.font = `${fontSize}px ${fontFamily}`;

  const lines = [];

  let breakPos = 0;
  for (let i = 0; i < breaks.length; i++) {
    lines.push(text?.slice(breakPos, breaks[i]) || "");
    breakPos = breaks[i] + 1;
  }

  lines.push(text?.slice(breakPos) || "");

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(
      lines[i] as string,
      x1,
      (y1 + (fontSize as number) * i * 1.5) as number
    );
  }
}
