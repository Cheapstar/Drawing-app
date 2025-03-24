/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  nearPoint,
  quadraticBezierMidpoint,
} from "@/components/utils/position";
import { CURSOR_RANGE } from "@/Constants";
import { BoundingElement, LineElement, Point } from "@/types/types";

export function checkOnline(
  client: Point,
  element: LineElement,
  scale?: number
) {
  const halfStroke = (element.strokeWidth as number) / 8;

  for (let t = 0; t <= 1; t += 0.01) {
    // Iterate over `t` values
    const bx =
      (1 - t) * (1 - t) * element.x1 +
      2 * (1 - t) * t * (element.controlPoint as Point).x +
      t * t * element.x2;
    const by =
      (1 - t) * (1 - t) * element.y1 +
      2 * (1 - t) * t * (element.controlPoint as Point).y +
      t * t * element.y2;

    if (
      Math.abs(bx - client.x) < halfStroke &&
      Math.abs(by - client.y) < halfStroke
    ) {
      return true; // Point is on the curve
    }
  }
  return false;
}

export function selectedPositionOnLine(
  selectedElement: LineElement,
  client: Point,
  scale: number
) {
  // We Need To check is it on the corners or on the middle or else where

  // Only one of them will be true

  //check corners
  const onStart = nearPoint(
    selectedElement.x1,
    selectedElement.y1,
    client.x,
    client.y,
    CURSOR_RANGE / scale
  )
    ? "start"
    : null;

  const onEnd = nearPoint(
    selectedElement.x2,
    selectedElement.y2,
    client.x,
    client.y,
    CURSOR_RANGE / scale
  )
    ? "end"
    : null;

  const midPoints = quadraticBezierMidpoint(selectedElement);
  const onMiddle = nearPoint(
    midPoints.x,
    midPoints.y,
    client.x,
    client.y,
    CURSOR_RANGE / scale
  )
    ? "middle"
    : null;

  return onStart || onEnd || onMiddle;
}
