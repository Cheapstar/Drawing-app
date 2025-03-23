import { nearPoint } from "@/components/utils/position";
import { CURSOR_RANGE } from "@/Constants";
import { BoundingElement, Element, Point } from "@/types/types";
import { getTheBoundingElement } from "./boundingElement";

export function positionWithinBoundingElement(
  client: Point,
  selectedElement: Element
) {
  const { x1, x2, y1, y2 } = getTheBoundingElement(
    selectedElement as Element
  ) as BoundingElement;

  const threshold = CURSOR_RANGE;
  // Checking on the corners
  const topLeft = nearPoint(x1, y1, client.x, client.y, CURSOR_RANGE)
    ? "tl"
    : null;
  const bottomLeft = nearPoint(x1, y2, client.x, client.y, CURSOR_RANGE)
    ? "bl"
    : null;
  const topRight = nearPoint(x2, y1, client.x, client.y, CURSOR_RANGE)
    ? "tr"
    : null;
  const bottomRight = nearPoint(x2, y2, client.x, client.y, CURSOR_RANGE)
    ? "br"
    : null;

  // Checking on the edges
  const top =
    client.x >= x1 &&
    client.x <= x2 &&
    Math.abs(y1 - client.y) <= (threshold as number)
      ? "t"
      : null;
  const left =
    client.y >= y1 &&
    client.y <= y2 &&
    Math.abs(x1 - client.x) <= (threshold as number)
      ? "l"
      : null;
  const right =
    client.y >= y1 &&
    client.y <= y2 &&
    Math.abs(x2 - client.x) <= (threshold as number)
      ? "r"
      : null;
  const bottom =
    client.x >= x1 &&
    client.x <= x2 &&
    Math.abs(y2 - client.y) <= (threshold as number)
      ? "b"
      : null;

  // Check if point is inside the bounding box
  const inside =
    client.x > x1 && client.x < x2 && client.y > y1 && client.y < y2
      ? "inside"
      : null;

  return (
    topLeft ||
    bottomLeft ||
    topRight ||
    bottomRight ||
    top ||
    left ||
    right ||
    bottom ||
    inside ||
    "none"
  );
}
