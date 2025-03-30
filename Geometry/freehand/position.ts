import { nearPoint } from "../utils";
import { FreehandElement, Point } from "@/types/types";

export const checkOnFreehand = (
  client: Point,
  element: FreehandElement,
  scale: number
) => {
  if (!element.stroke || element.stroke.length < 1) return null;

  const strokeTolerance = Math.max((element.strokeWidth as number) / scale, 2);
  if (element.stroke.length === 1)
    return nearPoint(
      element.stroke[0][0],
      element.stroke[0][1],
      client.x,
      client.y,
      strokeTolerance
    );

  for (let i = 0; i < element.stroke.length - 1; i++) {
    const [x1, y1] = element.stroke[i];
    const [x2, y2] = element.stroke[i + 1];

    if (pointNearSegment(client.x, client.y, x1, y1, x2, y2, strokeTolerance)) {
      return true;
    }
  }

  return null;
};

function pointNearSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number
) {
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (lengthSquared === 0) return Math.hypot(px - x1, py - y1) <= threshold;

  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lengthSquared;
  t = Math.max(0, Math.min(1, t)); // Clamp t between 0 and 1

  const closestX = x1 + t * (x2 - x1);
  const closestY = y1 + t * (y2 - y1);

  return Math.hypot(px - closestX, py - closestY) <= threshold;
}
