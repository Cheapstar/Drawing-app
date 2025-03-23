/* eslint-disable @typescript-eslint/no-unused-vars */
import { quadraticBezierMidpoint } from "@/components/utils/position";
import { PADDING } from "@/Constants";
import { LineElement } from "@/types/types";

export function getLineBoundingElement(element: LineElement, scale: number) {
  if (!element.isCurved) return null;

  const midPoints = quadraticBezierMidpoint(element);
  const x1 = Math.min(element.x1, element.x2, midPoints.x);
  const y1 = Math.min(element.y1, element.y2, midPoints.y);
  const x2 = Math.max(element.x1, element.x2, midPoints.x);
  const y2 = Math.max(element.y1, element.y2, midPoints.y);

  return {
    x1: x1 - PADDING.line,
    x2: x2 + PADDING.line,
    y1: y1 - PADDING.line,
    y2: y2 + PADDING.line,
    padding: PADDING.line,
    width: x2 - x1 + 2 * PADDING.line,
    height: y2 - y1 + 2 * PADDING.line,
    type: "line",
    strokeWidth: element.strokeWidth,
  };
}
