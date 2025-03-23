import { Element } from "@/types/types";
import { getLineBoundingElement } from "../line/boundingElement";
import { getRectBoundingElement } from "../rectangle/boundingElement";
import { getFreehandBoundingElement } from "../freehand/boundingElement";

export function getTheBoundingElement(element: Element, scale?: number) {
  switch (element.type) {
    case "line":
      return getLineBoundingElement(element, scale as number);
    case "rectangle":
      return getRectBoundingElement(element, scale as number);
    case "freehand":
      return getFreehandBoundingElement(element, scale as number);
  }
}
