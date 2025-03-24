import { Point, TextElement } from "@/types/types";

export function checkOnText(
  client: Point,
  element: TextElement,
  boardRef: React.RefObject<HTMLCanvasElement>
) {
  const { x1, y1, text, fontSize, fontFamily, breaks } = element;
  if (!boardRef.current) return false;

  const ctx = boardRef.current.getContext("2d");
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

  // Check if the client click is inside the text bounding box
  const isInside =
    client.x >= x1 && client.x <= x2 && client.y >= y1 && client.y <= y2;

  return isInside;
}
