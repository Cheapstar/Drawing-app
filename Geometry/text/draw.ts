import { TextElement } from "@/types/types";

export function drawText(ctx: CanvasRenderingContext2D, element: TextElement) {
  const { x1, y1, text, color, fontSize, fontFamily } = element;

  ctx.textBaseline = "top";
  ctx.textRendering = "geometricPrecision";
  ctx.fillStyle = color as string;
  if (element.opacity) {
    ctx.globalAlpha = element.opacity;
  }
  ctx.font = `${fontSize}px ${fontFamily}`;

  const lines = text?.split("\n") as string[];

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(
      lines[i] as string,
      x1,
      (y1 + (fontSize as number) * i * 1.5) as number
    );
  }
}
