import { drawHandle } from "@/Geometry/elements/draw";
import { RectangleElement } from "@/types/types";

export const createRectangle = (
  element: RectangleElement,
  ctx: CanvasRenderingContext2D
) => {
  const width = element.x2 - element.x1;
  const height = element.y2 - element.y1;

  ctx.strokeStyle = element.color as string;
  ctx.lineWidth = (element.strokeWidth as number) / 4;
  ctx.lineJoin = "round";
  ctx.strokeRect(element.x1, element.y1, width, height);
};

export function drawBoundingBoxRect(
  ctx: CanvasRenderingContext2D,
  element: RectangleElement
) {
  const { x1, y1, x2, y2 } = element;

  const newX1 = Math.min(x1, x2);
  const newX2 = Math.max(x1, x2);
  const newY1 = Math.min(y1, y2);
  const newY2 = Math.max(y1, y2);

  const padding = 10;

  ctx.beginPath();
  ctx.strokeStyle = "#6965db";
  ctx.strokeRect(
    newX1 - padding,
    newY1 - padding,
    newX2 - newX1 + 2 * padding,
    newY2 - newY1 + 2 * padding
  );

  // Draw control points
  ctx.fillStyle = "white";

  ctx.closePath();

  // Corner handles
  drawHandle(ctx, newX1 - padding, newY1 - padding);
  drawHandle(ctx, newX2 + padding, newY1 - padding);
  drawHandle(ctx, newX1 - padding, newY2 + padding);
  drawHandle(ctx, newX2 + padding, newY2 + padding);
}
