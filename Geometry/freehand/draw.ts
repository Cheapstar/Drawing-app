import { drawHandle } from "@/Geometry/elements/draw";
import { DEFAULT_STROKE_OPTIONS } from "@/Constants";
import { FreehandElement } from "@/types/types";
import getStroke from "perfect-freehand";

export const createFreeHand = (element: FreehandElement) => {
  const path = new Path2D();
  const outline = getStroke(element.stroke, {
    ...DEFAULT_STROKE_OPTIONS,
    size: element.strokeWidth,
  });

  if (outline.length < 2)
    return {
      path,
      x1: outline[0][0],
      y1: outline[0][1],
      x2: outline[0][0],
      y2: outline[0][1],
    };

  path.moveTo(outline[0][0], outline[0][1]);

  let minX = outline[0][0];
  let maxX = outline[0][0];
  let minY = outline[0][1];
  let maxY = outline[0][1];

  // Draw smooth curves through points
  for (let i = 1; i < outline.length - 1; i++) {
    const xc = (outline[i][0] + outline[i + 1][0]) / 2;
    const yc = (outline[i][1] + outline[i + 1][1]) / 2;
    path.quadraticCurveTo(outline[i][0], outline[i][1], xc, yc);

    // updating the min's and max's
    minX = Math.min(outline[i][0], minX);
    maxX = Math.max(outline[i][0], maxX);
    minY = Math.min(outline[i][1], minY);
    maxY = Math.max(outline[i][1], maxY);
  }

  path.closePath();
  return path;
};

export function drawBoundingBoxFreehand(
  ctx: CanvasRenderingContext2D,
  element: FreehandElement
) {
  // Initialize with extreme values or first point if available
  if (!element.stroke.length) {
    return;
  }

  let minX = element.stroke[0][0];
  let maxX = element.stroke[0][0];
  let minY = element.stroke[0][1];
  let maxY = element.stroke[0][1];

  // Loop through all points to find min/max values
  for (const [x, y] of element.stroke) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const padding = element.strokeWidth as number;

  ctx.beginPath();
  ctx.strokeStyle = "#6965db";
  ctx.strokeRect(
    minX - padding,
    minY - padding,
    maxX - minX + 2 * padding,
    maxY - minY + 2 * padding
  );

  // Draw control points
  ctx.closePath();

  ctx.fillStyle = "white";
  drawHandle(ctx, minX - padding, minY - padding);
  drawHandle(ctx, minX - padding, maxY + padding);
  drawHandle(ctx, maxX + padding, minY - padding);
  drawHandle(ctx, maxX + padding, maxY + padding);
}
