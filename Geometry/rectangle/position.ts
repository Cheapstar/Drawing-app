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

  if (!(client.x >= x1 && client.x <= x2 && client.y >= y1 && client.y <= y2))
    return false;

  const threshold = (strokeWidth as number) / scale;

  const top =
    client.x >= x1 - threshold &&
    client.x <= x2 + threshold &&
    Math.abs(y1 - client.y) <= threshold;

  const bottom =
    client.x >= x1 - threshold &&
    client.x <= x2 + threshold &&
    Math.abs(y2 - client.y) <= threshold;

  const left =
    client.y >= y1 - threshold &&
    client.y <= y2 + threshold &&
    Math.abs(x1 - client.x) <= threshold;

  const right =
    client.y >= y1 - threshold &&
    client.y <= y2 + threshold &&
    Math.abs(x2 - client.x) <= threshold;

  return top || left || right || bottom;
};
