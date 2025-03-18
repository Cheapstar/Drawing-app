import { Point, SelectedPosition, Element, LineElement } from "@/types/types";
import { BoundingElement } from "../WhiteBoard";

export const getElementAtPosition = (
  clientX: number,
  clientY: number,
  elements: Element[],
  scale?: number
): Partial<Element> => {
  let position: boolean = false;

  const foundElement = elements.find((element: Element) => {
    position = positionWithinShape(
      point(clientX, clientY),
      element,
      scale as number
    );
    return position;
  });

  console.log("Found Element Position is ", position);

  return {
    ...(foundElement || {}),
  };
};

export const positionWithinShape = (
  client: Point,
  element: Element,
  scale?: number
): boolean => {
  switch (element.type) {
    case "rectangle":
    case "line":
      return positionOnLine(client, element as LineElement, scale as number);
    case "freehand":

    case "text":

    default:
      return false;
  }
};

export const nearPoint = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  return Math.abs(x2 - x1) < 5 && Math.abs(y2 - y1) < 5;
};

export const positionOnPencil = (client: Point, stroke?: number[][]) => {
  if (!stroke || stroke.length < 1) return null;
  if (stroke.length === 1) {
    return nearPoint(client.x, client.y, stroke[0][0], stroke[0][1])
      ? "inside"
      : null;
  }

  let a = stroke[0];

  for (let i = 1; i < stroke.length; i++) {
    const b = stroke[i];
    const res = positionOnLine(client, point(a[0], a[1]), point(b[0], b[1]));
    if (res) {
      return res;
    }

    a = b;
  }
  return null;
};

export const positionOnRectangle = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): SelectedPosition => {
  const topLeft = nearPoint(clientX, clientY, x1, y1) ? "tl" : null;
  const topRight = nearPoint(clientX, clientY, x2, y1) ? "tr" : null;
  const bottomLeft = nearPoint(clientX, clientY, x1, y2) ? "bl" : null;
  const bottomRight = nearPoint(clientX, clientY, x2, y2) ? "br" : null;

  const top = positionOnLine(
    point(clientX, clientY),
    point(x1, y1),
    point(x2, y1)
  )
    ? "t"
    : null;
  const right = positionOnLine(
    point(clientX, clientY),
    point(x2, y1),
    point(x2, y2)
  )
    ? "r"
    : null;
  const bottom = positionOnLine(
    point(clientX, clientY),
    point(x1, y2),
    point(x2, y2)
  )
    ? "b"
    : null;
  const left = positionOnLine(
    point(clientX, clientY),
    point(x1, y1),
    point(x1, y2)
  )
    ? "l"
    : null;

  const inside =
    clientX >= x1 && clientY >= y1 && clientX <= x2 && clientY <= y2
      ? "inside"
      : null;

  return (
    topLeft ||
    topRight ||
    bottomLeft ||
    bottomRight ||
    top ||
    right ||
    bottom ||
    left ||
    inside
  );
};

export const distance = (a: Point, b: Point): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const point = (x: number, y: number): Point => ({ x, y });

function positionOnLine(client: Point, element: LineElement, scale: number) {
  const halfStroke = (element.strokeWidth as number) / (2 * scale);

  for (let t = 0; t <= 1; t += 0.01) {
    // Iterate over `t` values
    const bx =
      (1 - t) * (1 - t) * element.x1 +
      2 * (1 - t) * t * element.controlPoint.x +
      t * t * element.x2;
    const by =
      (1 - t) * (1 - t) * element.y1 +
      2 * (1 - t) * t * element.controlPoint.y +
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

  if (boundingBox.type === "line") {
    const { x1, x2, y1, y2, padding, strokeWidth } = boundingBox;

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
      client.x >= x1 &&
      client.x <= x2 &&
      Math.abs(y1 - client.y) <= (strokeWidth as number)
        ? "t"
        : null;
    const left =
      client.y >= y1 &&
      client.y <= y2 &&
      Math.abs(x1 - client.x) <= (strokeWidth as number)
        ? "l"
        : null;
    const right =
      client.y >= y1 &&
      client.y <= y2 &&
      Math.abs(x2 - client.x) <= (strokeWidth as number)
        ? "r"
        : null;
    const bottom =
      client.x >= x1 &&
      client.x <= x2 &&
      Math.abs(y2 - client.y) <= (strokeWidth as number)
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
