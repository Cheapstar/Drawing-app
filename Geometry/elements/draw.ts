import { RoughCanvas } from "roughjs/bin/canvas";
import { BoundingElement, Element, LineElement, Point } from "@/types/types";
import { createFreeHand } from "@/Geometry/freehand/draw";
import { createLine } from "@/Geometry/line/draw";
import { createRectangle } from "@/Geometry/rectangle/draw";
import { quadraticBezierMidpoint } from "@/Geometry/utils";
import { getTheBoundingElement } from "./boundingElement";
import { drawText } from "../text/draw";
import { Participant } from "@/components/hooks/useCollab";

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
    case "image":
      ctx.save();
      const image = new Image();
      image.src = element.url;
      ctx.drawImage(
        image,
        element.x1,
        element.y1,
        element.width,
        element.height
      );
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

export function drawCursor(
  participant: Participant,
  ctx: CanvasRenderingContext2D,
  scale: number
) {
  ctx.save();

  // Draw cursor pointer (triangle shape)
  drawCursorPointer(ctx, participant, scale);

  // Draw username label
  drawUsernameLabel(ctx, participant, scale);

  ctx.restore();
}

/**
 * Draws the triangular cursor pointer
 */
function drawCursorPointer(
  ctx: CanvasRenderingContext2D,
  participant: Participant,
  scale: number
) {
  ctx.beginPath();
  ctx.moveTo(participant.position.x, participant.position.y); // Tip of cursor
  ctx.lineTo(
    participant.position.x + 15 / scale,
    participant.position.y + 15 / scale
  );
  ctx.lineTo(
    participant.position.x + 5 / scale,
    participant.position.y + 15 / scale
  );
  ctx.lineTo(participant.position.x, participant.position.y + 20 / scale);
  ctx.fillStyle = participant.userDetails.color;
  ctx.fill();
  ctx.closePath();
}

/**
 * Draws the rounded rectangle with username text
 */
function drawUsernameLabel(
  ctx: CanvasRenderingContext2D,
  participant: Participant,
  scale: number
) {
  // Configure font
  const fontSize = 16 / scale;
  ctx.font = `${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(participant.userDetails.userName).width;

  // Draw rounded rectangle background
  const rectX = participant.position.x - 10 / scale;
  const rectY = participant.position.y + (20 + 10) / scale;
  const rectWidth = textWidth + 20 / scale;
  const rectHeight = fontSize + 15 / scale;
  const cornerRadius = 8 / scale;

  ctx.beginPath();
  ctx.roundRect(rectX, rectY, rectWidth, rectHeight, [cornerRadius]);
  ctx.fillStyle = participant.userDetails.color;
  ctx.fill();
  ctx.closePath();

  // Draw username text
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.fillText(
    participant.userDetails.userName,
    participant.position.x + 2 / scale,
    participant.position.y + (20 + 30) / scale
  );
  ctx.closePath();
}
