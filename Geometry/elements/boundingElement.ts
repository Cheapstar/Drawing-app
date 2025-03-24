import { Element } from "@/types/types";
import { getLineBoundingElement } from "../line/boundingElement";
import { getRectBoundingElement } from "../rectangle/boundingElement";
import { getFreehandBoundingElement } from "../freehand/boundingElement";
import { getTextBoundingElement } from "../text/boundingElement";

export function getTheBoundingElement(
  element: Element,
  ctx: CanvasRenderingContext2D,
  scale?: number
) {
  switch (element.type) {
    case "line":
      return getLineBoundingElement(element, scale as number);
    case "rectangle":
      return getRectBoundingElement(element, scale as number);
    case "freehand":
      return getFreehandBoundingElement(element, scale as number);
    case "text":
      return getTextBoundingElement(element, ctx, scale as number);
  }
}
