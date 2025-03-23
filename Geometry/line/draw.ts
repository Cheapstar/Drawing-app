/* eslint-disable @typescript-eslint/no-unused-vars */
import { drawHandle } from "@/components/utils/elements";
import { quadraticBezierMidpoint } from "@/components/utils/position";
import { LineElement } from "@/types/types";

// Drawing on the Canvas
export const createLine = (
  element: LineElement,
  ctx: CanvasRenderingContext2D
) => {
  ctx.beginPath();
  ctx.moveTo(element.x1, element.y1);

  if (element.controlPoint) {
    ctx.quadraticCurveTo(
      element.controlPoint.x,
      element.controlPoint.y,
      element.x2,
      element.y2
    );
  } else {
    const midX = (element.x1 + element.x2) / 2;
    const midY = (element.y1 + element.y2) / 2;
    ctx.quadraticCurveTo(midX, midY, element.x2, element.y2);
  }
  if (element.opacity) {
    ctx.globalAlpha = element.opacity;
  }
  ctx.strokeStyle = element.color as string;
  ctx.lineWidth = (element.strokeWidth as number) / 4;
  ctx.lineCap = "round";
  ctx.stroke();
};

// Anchor Points for line
export function drawAnchorPoints(
  ctx: CanvasRenderingContext2D,
  element: LineElement,
  scale: number
) {
  // Here hume draw karne hai anchor points , two on the corners aur last on the middle , jo ki control point hoga
  const radius = 5 / scale;

  ctx.beginPath();
  ctx.arc(element.x1, element.y1, radius, 0, Math.PI * 2, false);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "#6965db";
  ctx.fill();
  ctx.stroke();
  ctx.closePath();

  const midPoints = quadraticBezierMidpoint(element);
  ctx.beginPath();
  ctx.arc(midPoints.x, midPoints.y, radius, 0, Math.PI * 2, false);
  ctx.fillStyle = "#6965db";
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(element.x2, element.y2, radius, 0, Math.PI * 2, false);

  ctx.fillStyle = "white";
  ctx.strokeStyle = "#6965db";
  ctx.fill();
  ctx.stroke();
  ctx.closePath();
}

export function drawCurveBoundingBox(
  ctx: CanvasRenderingContext2D,
  element: LineElement,
  scale: number
) {
  const midPoints = quadraticBezierMidpoint(element);
  const x1 = Math.min(element.x1, element.x2, midPoints.x);
  const y1 = Math.min(element.y1, element.y2, midPoints.y);
  const x2 = Math.max(element.x1, element.x2, midPoints.x);
  const y2 = Math.max(element.y1, element.y2, midPoints.y);

  ctx.beginPath();
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  ctx.strokeStyle = "#6965db";
  ctx.stroke();
  ctx.closePath();

  const padding = 8;
  // Draw small rounded rectangles at bounding box corners
  drawHandle(ctx, x1 - padding, y1 - padding); // Top-left
  drawHandle(ctx, x2 + padding, y1 - padding); // Top-right
  drawHandle(ctx, x1 - padding, y2 + padding); // Bottom
  drawHandle(ctx, x2 + padding, y2 + padding); // Bottom
}
