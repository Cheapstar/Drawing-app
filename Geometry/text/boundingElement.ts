/* eslint-disable @typescript-eslint/no-unused-vars */
import { TextElement } from "@/types/types";

export function getTextBoundingElement(
  element: TextElement,
  ctx: CanvasRenderingContext2D,
  scale: number
) {
  const { x1, y1, text, fontSize, fontFamily, breaks, height, width } = element;

  if (!ctx) return false;

  ctx.font = `${fontSize}px ${fontFamily}`;

  const lines: string[] = [];
  let breakPos = 0;

  for (let i = 0; i < breaks.length; i++) {
    lines.push(text?.slice(breakPos, breaks[i]) || "");
    breakPos = breaks[i] + 2;
  }
  lines.push(text?.slice(breakPos) || "");

  // Find the longest line for width calculation
  const longestLine = lines.reduce((a, b) =>
    ctx.measureText(a).width > ctx.measureText(b).width ? a : b
  );

  const textWidth = ctx.measureText(longestLine).width;
  const textHeight = (fontSize as number) * lines.length * 1.5; // Approximate line height

  const x2 = x1 + Math.max(textWidth, width);
  const y2 = y1 + Math.max(textHeight, height);

  return {
    x1,
    x2,
    y1,
    y2,
    width: Math.max(textWidth, width),
    height: Math.max(textHeight, height),
  };
}

export function getTextElementDetails(
  element: TextElement,
  ctx: CanvasRenderingContext2D,
  scale?: number
) {
  const { x1, y1, text, fontSize, fontFamily, breaks } = element;

  if (!ctx) return false;

  ctx.font = `${fontSize}px ${fontFamily}`;

  const lines: string[] = [];
  let breakPos = 0;

  for (let i = 0; i < breaks.length; i++) {
    lines.push(text?.slice(breakPos, breaks[i]) || "");
    breakPos = breaks[i] + 2;
  }
  lines.push(text?.slice(breakPos) || "");

  // Find the longest line for width calculation
  const longestLine = lines.reduce((a, b) =>
    ctx.measureText(a).width > ctx.measureText(b).width ? a : b
  );

  const textWidth = ctx.measureText(longestLine).width;
  const textHeight = (fontSize as number) * lines.length * 1.5; // Approximate line height

  const x2 = x1 + textWidth;
  const y2 = y1 + textHeight;

  return {
    x1,
    x2,
    y1,
    y2,
    width: textWidth,
    height: textHeight,
  };
}
