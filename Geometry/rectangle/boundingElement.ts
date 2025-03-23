/* eslint-disable @typescript-eslint/no-unused-vars */
import { quadraticBezierMidpoint } from "@/components/utils/position";
import { PADDING } from "@/Constants";
import { RectangleElement } from "@/types/types";

export function getRectBoundingElement(
  element: RectangleElement,
  scale: number
) {
  const x1 = Math.min(element.x1, element.x2);
  const y1 = Math.min(element.y1, element.y2);
  const x2 = Math.max(element.x1, element.x2);
  const y2 = Math.max(element.y1, element.y2);

  return {
    x1: x1 - PADDING.rectangle,
    x2: x2 + PADDING.rectangle,
    y1: y1 - PADDING.rectangle,
    y2: y2 + PADDING.rectangle,
    padding: PADDING.rectangle,
    width: x2 - x1 + 2 * PADDING.rectangle,
    height: y2 - y1 + 2 * PADDING.rectangle,
    type: "rectangle",
    strokeWidth: element.strokeWidth,
  };
}
