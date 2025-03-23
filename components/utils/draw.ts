import { RoughCanvas } from "roughjs/bin/canvas";
import { Element } from "@/types/types";
import { createFreeHand } from "@/Geometry/freehand/draw";
import { createLine } from "@/Geometry/line/draw";
import { createRectangle } from "@/Geometry/rectangle/draw";

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
      console.log("Drawing the Rectangle");
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
