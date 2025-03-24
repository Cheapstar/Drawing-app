import {
  Point,
  Element,
  LineElement,
  RectangleElement,
  TextElement,
} from "@/types/types";
import { checkOnline } from "@/Geometry/line/position";
import { checkOnRectangle } from "@/Geometry/rectangle/position";
import { checkOnFreehand } from "@/Geometry/freehand/position";
import { checkOnText } from "@/Geometry/text/position";
export const getElementAtPosition = (
  clientX: number,
  clientY: number,
  elements: Element[],
  scale?: number,
  boardRef?: React.RefObject<HTMLCanvasElement>
): Partial<Element> | undefined => {
  let result: boolean = false;

  const foundElement = elements.find((element: Element) => {
    result = checkOnElements(
      point(clientX, clientY),
      element,
      scale as number,
      boardRef
    );
    return result;
  });

  console.log("Found Element Position is ", result);

  return foundElement;
};

export const checkOnElements = (
  client: Point,
  element: Element,
  scale?: number,
  boardRef?: React.RefObject<HTMLCanvasElement>
): boolean => {
  switch (element.type) {
    case "rectangle":
      return checkOnRectangle(
        client,
        element as RectangleElement,
        scale as number
      );
    case "line":
      return checkOnline(client, element as LineElement, scale as number);
    case "freehand":
      return checkOnFreehand(client, element) as boolean;
    case "text":
      return checkOnText(
        client,
        element as TextElement,
        boardRef as React.RefObject<HTMLCanvasElement>
      );
    default:
      return false;
  }
};

export const nearPoint = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  range: number = 5
): boolean => {
  return Math.abs(x2 - x1) < range && Math.abs(y2 - y1) < range;
};

export const distance = (a: Point, b: Point): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const point = (x: number, y: number): Point => ({ x, y });

export function quadraticBezierMidpoint(element: LineElement) {
  const mx =
    0.25 * element.x1 +
    0.5 * (element.controlPoint as Point).x +
    0.25 * element.x2;
  const my =
    0.25 * element.y1 +
    0.5 * (element.controlPoint as Point).y +
    0.25 * element.y2;
  return { x: mx, y: my };
}

export function getNewControlPoints(element: LineElement, client: Point) {
  const { x1, y1, x2, y2 } = element;
  const { x, y } = client;

  return {
    x: 2 * (x - 0.25 * x1 - 0.25 * x2),
    y: 2 * (y - 0.25 * y1 - 0.25 * y2),
  };
}

export function getPositionOnBoundingBox(
  boundingBox: BoundingElement,
  client: Point
) {
  if (!boundingBox) return "none";

  if (boundingBox.type === "rectangle") {
    const { x1, x2, y1, y2, padding } = boundingBox;

    const threshold = 2;
    // Checking on the corners
    const topLeft = nearPoint(x1 - padding, y1 - padding, client.x, client.y)
      ? "tl"
      : null;
    const bottomLeft = nearPoint(x1 - padding, y2 + padding, client.x, client.y)
      ? "bl"
      : null;
    const topRight = nearPoint(x2 + padding, y1 - padding, client.x, client.y)
      ? "tr"
      : null;
    const bottomRight = nearPoint(
      x2 + padding,
      y2 + padding,
      client.x,
      client.y
    )
      ? "br"
      : null;

    // Checking on the edges
    const top =
      client.x >= x1 - padding &&
      client.x <= x2 + padding &&
      Math.abs(y1 - padding - client.y) <= (threshold as number)
        ? "t"
        : null;
    const left =
      client.y >= y1 - padding &&
      client.y <= y2 + padding &&
      Math.abs(x1 - padding - client.x) <= (threshold as number)
        ? "l"
        : null;
    const right =
      client.y >= y1 - padding &&
      client.y <= y2 + padding &&
      Math.abs(x2 + padding - client.x) <= (threshold as number)
        ? "r"
        : null;
    const bottom =
      client.x >= x1 - padding &&
      client.x <= x2 + padding &&
      Math.abs(y2 + padding - client.y) <= (threshold as number)
        ? "b"
        : null;

    // Check if point is inside the bounding box
    const inside =
      client.x > x1 - padding &&
      client.x < x2 + padding &&
      client.y > y1 - padding &&
      client.y < y2 + padding
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
  if (boundingBox.type === "line") {
    const { x1, x2, y1, y2, padding } = boundingBox;

    const threshold = 1;
    // Checking on the corners
    const topLeft = nearPoint(x1 - padding, y1 - padding, client.x, client.y)
      ? "tl"
      : null;
    const bottomLeft = nearPoint(x1 - padding, y2 + padding, client.x, client.y)
      ? "bl"
      : null;
    const topRight = nearPoint(x2 + padding, y1 - padding, client.x, client.y)
      ? "tr"
      : null;
    const bottomRight = nearPoint(
      x2 + padding,
      y2 + padding,
      client.x,
      client.y
    )
      ? "br"
      : null;

    // Checking on the edges
    const top =
      client.x >= x1 - threshold &&
      client.x <= x2 + threshold &&
      Math.abs(y1 - client.y) <= (threshold as number)
        ? "t"
        : null;
    const left =
      client.y >= y1 - threshold &&
      client.y <= y2 + threshold &&
      Math.abs(x1 - client.x) <= (threshold as number)
        ? "l"
        : null;
    const right =
      client.y >= y1 - threshold &&
      client.y <= y2 + threshold &&
      Math.abs(x2 - client.x) <= (threshold as number)
        ? "r"
        : null;
    const bottom =
      client.x >= x1 - threshold &&
      client.x <= x2 + threshold &&
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
  if (boundingBox.type === "freehand") {
    const { x1, x2, y1, y2 } = boundingBox;

    const padding = boundingBox.strokeWidth as number;

    const threshold = padding;
    // Checking on the corners
    const topLeft = nearPoint(x1 - padding, y1 - padding, client.x, client.y)
      ? "tl"
      : null;
    const bottomLeft = nearPoint(x1 - padding, y2 + padding, client.x, client.y)
      ? "bl"
      : null;
    const topRight = nearPoint(x2 + padding, y1 - padding, client.x, client.y)
      ? "tr"
      : null;
    const bottomRight = nearPoint(
      x2 + padding,
      y2 + padding,
      client.x,
      client.y
    )
      ? "br"
      : null;

    // Checking on the edges
    const top =
      client.x >= x1 - threshold &&
      client.x <= x2 + threshold &&
      Math.abs(y1 - client.y) <= (threshold as number)
        ? "t"
        : null;
    const left =
      client.y >= y1 - threshold &&
      client.y <= y2 + threshold &&
      Math.abs(x1 - client.x) <= (threshold as number)
        ? "l"
        : null;
    const right =
      client.y >= y1 - threshold &&
      client.y <= y2 + threshold &&
      Math.abs(x2 - client.x) <= (threshold as number)
        ? "r"
        : null;
    const bottom =
      client.x >= x1 - threshold &&
      client.x <= x2 + threshold &&
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

  return "none";
}

/* 
First Thing yaha pe jo check karenge would be - has client clicked on any of the given Shape : 

-- We will check kya koi element cover the point clicked 
-- We need to go through each and every element and check it

1. Line :
-- Line ke liye 2 things we need to consider - Points and stroke width 
-- Points being (x1,y1) -- (x2,y2) and stroke width jo bhi ho
-- 

*/

//  export const positionOnLine = (
//    clientPoint: Point,
//    a: Point,
//    b: Point
//  ): SelectedPosition => {
//    const offset =
//      distance(a, b) - distance(a, clientPoint) - distance(b, clientPoint);
//    const inside = Math.abs(offset) < 1 ? "inside" : null;

//    const start = nearPoint(clientPoint.x, clientPoint.y, a.x, a.y)
//      ? "start"
//      : null;
//    const end = nearPoint(clientPoint.x, clientPoint.y, b.x, b.y) ? "end" : null;
//    return inside || start || end;
//  };

export const positionOnine = (
  client: Point,
  element: LineElement,
  scale: number
): boolean => {
  const { x1, y1, x2, y2, strokeWidth } = element;
  const halfStroke = (strokeWidth as number) / (2 * scale);

  // Early bounding box check
  if (
    client.x < x1 - halfStroke ||
    client.x > x2 + halfStroke ||
    client.y < Math.min(y1, y2) - halfStroke ||
    client.y > Math.max(y1, y2) + halfStroke
  ) {
    return false;
  }

  // Vertical line case (x1 == x2, y1 is always upper)
  if (x1 === x2) {
    console.log("Vertical case is running");
    return client.x >= x1 - halfStroke && client.x <= x1 + halfStroke;
  }

  // Horizontal line case
  if (y1 === y2) {
    console.log("Horizontal case is running");
    return client.y >= y1 - halfStroke && client.y <= y1 + halfStroke;
  }

  // Calculate perpendicular distance
  const perpDistance = getPerpendicularDistance(client, element) / scale;
  return perpDistance <= halfStroke;
};

export const getPerpendicularDistance = (
  point: Point,
  line: LineElement
): number => {
  const { x: x0, y: y0 } = point;
  const { x1, y1, x2, y2 } = line;

  const numerator = Math.abs(
    (y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1
  );
  const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

  return numerator / denominator;
};
