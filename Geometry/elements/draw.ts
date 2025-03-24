/* eslint-disable @typescript-eslint/no-unused-vars */
import { RoughCanvas } from "roughjs/bin/canvas";
import { BoundingElement, Element, LineElement } from "@/types/types";
import { createFreeHand } from "@/Geometry/freehand/draw";
import { createLine } from "@/Geometry/line/draw";
import { createRectangle } from "@/Geometry/rectangle/draw";
import { quadraticBezierMidpoint } from "@/components/utils/position";
import { getTheBoundingElement } from "./boundingElement";
import { drawText } from "../text/draw";

export const drawElement = (
  roughCanvas: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  element: Element
) => {
  switch (element.type) {
    case "line":
      ctx.save();
      createLine(element, ctx);
      ctx.restore();
      break;
    case "rectangle":
      ctx.save();
      if (element.opacity) {
        ctx.globalAlpha = element.opacity;
      }
      createRectangle(element, ctx);
      ctx.restore();
      break;
    case "freehand":
      ctx.save();
      ctx.fillStyle = element.color as string;
      if (element.opacity) {
        ctx.globalAlpha = element.opacity;
      }
      const freehand = createFreeHand(element);
      ctx.fill(freehand as Path2D);
      ctx.restore();
      break;
    case "text":
      ctx.save();
      drawText(ctx, element);
      ctx.restore();
      break;
  }
};

export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  selectedElement: Element,
  scale: number
) {
  const { type } = selectedElement;

  if (type === "line") {
    console.log("Drawing the Anchor Points");
    drawAnchorPoints(ctx, selectedElement, scale);
    if (selectedElement.isCurved) {
      drawCurveBoundingBox(ctx, selectedElement, scale);
    }
  } else {
    drawElementBoundingBox(ctx, selectedElement, scale);
  }
}

export function drawElementBoundingBox(
  ctx: CanvasRenderingContext2D,
  selectedElement: Element,
  scale: number
) {
  const { x1, x2, y1, y2, width, height } = getTheBoundingElement(
    selectedElement,
    ctx
  ) as BoundingElement;

  ctx.beginPath();
  ctx.strokeStyle = "#6965db";
  ctx.lineWidth = 1 / scale;
  ctx.strokeRect(x1, y1, width as number, height as number);

  ctx.closePath();

  drawHandle(ctx, x1, y1, scale); // Top-left
  drawHandle(ctx, x2, y1, scale); // Top-right
  drawHandle(ctx, x1, y2, scale); // Bottom
  drawHandle(ctx, x2, y2, scale); // Bottom
}

export function drawHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1
) {
  const handleSize = 8 / scale; // Adjust handle size inversely with scale
  ctx.fillStyle = "white";
  ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  ctx.roundRect(
    x - handleSize / 2,
    y - handleSize / 2,
    handleSize,
    handleSize,
    [2 / scale]
  );
  ctx.stroke();
}

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
  ctx.lineWidth = 1 / scale;
  ctx.fill();
  ctx.stroke();
  ctx.closePath();

  const midPoints = quadraticBezierMidpoint(element);
  ctx.beginPath();
  ctx.arc(midPoints.x, midPoints.y, radius, 0, Math.PI * 2, false);
  ctx.fillStyle = "#6965db";
  ctx.lineWidth = 1 / scale;
  ctx.fill();
  ctx.closePath();

  ctx.beginPath();
  ctx.arc(element.x2, element.y2, radius, 0, Math.PI * 2, false);
  ctx.lineWidth = 1 / scale;
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
  ctx.lineWidth = 1 / scale;

  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  ctx.strokeStyle = "#6965db";
  ctx.stroke();
  ctx.closePath();

  const padding = 8;
  // Draw small rounded rectangles at bounding box corners
  drawHandle(ctx, x1 - padding, y1 - padding, scale); // Top-left
  drawHandle(ctx, x2 + padding, y1 - padding, scale); // Top-right
  drawHandle(ctx, x1 - padding, y2 + padding, scale); // Bottom
  drawHandle(ctx, x2 + padding, y2 + padding, scale); // Bottom
}
