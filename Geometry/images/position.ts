import { CURSOR_RANGE } from "@/Constants";
import { Point, Element, ImageElement } from "@/types/types";
import { nearPoint } from "../utils";

export function checkOnImage(client: Point, element: Element, scale: number) {
  const { x1, x2, y1, y2 } = element as ImageElement;

  return client.x >= x1 && client.x <= x2 && client.y >= y1 && client.y <= y2
    ? true
    : false;
}
