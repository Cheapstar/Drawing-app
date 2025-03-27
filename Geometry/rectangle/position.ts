/* eslint-disable @typescript-eslint/no-unused-vars */
import { nearPoint } from "@/Geometry/utils";
import { CURSOR_RANGE } from "@/Constants";
import { BoundingElement, Point, RectangleElement } from "@/types/types";

export const checkOnRectangle = (
  client: Point,
  element: RectangleElement,
  scale: number
) => {
  const { x1, x2, y1, y2, strokeWidth } = element;

  // Ensure a minimum threshold to avoid being too small when zoomed out
  const threshold = Math.max((strokeWidth as number) / scale, 2);

  // Expand the bounding box by the threshold for outer clicks
  const expandedX1 = x1 - threshold;
  const expandedX2 = x2 + threshold;
  const expandedY1 = y1 - threshold;
  const expandedY2 = y2 + threshold;

  // If outside the expanded bounding box, return false
  if (
    client.x < expandedX1 ||
    client.x > expandedX2 ||
    client.y < expandedY1 ||
    client.y > expandedY2
  )
    return false;

  // Check if the click is near any edge (inner or outer side)
  const top =
    Math.abs(client.y - y1) <= threshold &&
    client.x >= expandedX1 &&
    client.x <= expandedX2;
  const bottom =
    Math.abs(client.y - y2) <= threshold &&
    client.x >= expandedX1 &&
    client.x <= expandedX2;
  const left =
    Math.abs(client.x - x1) <= threshold &&
    client.y >= expandedY1 &&
    client.y <= expandedY2;
  const right =
    Math.abs(client.x - x2) <= threshold &&
    client.y >= expandedY1 &&
    client.y <= expandedY2;

  return top || bottom || left || right;
};
