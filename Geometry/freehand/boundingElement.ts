/* eslint-disable @typescript-eslint/no-unused-vars */
import { PADDING } from "@/Constants";
import { BoundingElement, FreehandElement, Shapes } from "@/types/types";

export function getFreehandBoundingElement(
  element: FreehandElement,
  scale?: number
): BoundingElement | null {
  if (!element.stroke.length) {
    return null;
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

  return {
    type: "freehand" as Shapes,
    x1: minX - PADDING.freehand,
    x2: maxX + PADDING.freehand,
    y1: minY - PADDING.freehand,
    y2: maxY + PADDING.freehand,
    width: maxX - minX + 2 * PADDING.freehand,
    height: maxY - minY + 2 * PADDING.freehand,
    padding: PADDING.freehand,
  };
}
