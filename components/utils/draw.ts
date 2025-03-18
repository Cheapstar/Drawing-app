import { RoughCanvas } from "roughjs/bin/canvas";
import { Element } from "@/types/types";
import { Drawable } from "roughjs/bin/core";
import { createFreeHand, createRectangle } from "./elements";

export const drawElement = (
  roughCanvas: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  element: Element
) => {
  switch (element.type) {
    case "line":
      ctx.save();

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

      ctx.stroke();
      ctx.restore();

      break;
    case "rectangle":
      ctx.save();
      const rectangle = createRectangle(element);
      if (element.opacity) {
        ctx.globalAlpha = element.opacity;
      }
      roughCanvas.draw(rectangle as Drawable);
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
      ctx.textBaseline = "top";
      ctx.textRendering = "geometricPrecision";
      ctx.fillStyle = element.color as string;
      console.log("FontSize", element.fontSize);
      if (element.opacity) {
        ctx.globalAlpha = element.opacity;
      }
      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillText(element.text as string, element.x1, element.y1 as number);
      ctx.restore();
      break;
  }
};
