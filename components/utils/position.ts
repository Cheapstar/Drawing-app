import { Point, SelectedPosition, Shapes, Element } from "@/types/types";

export const getElementAtPosition = (
  clientX: number,
  clientY: number,
  elements: Element[]
): Partial<Element> & { selectedPosition: SelectedPosition } => {
  let position: SelectedPosition = null;

  const foundElement = elements.find(
    ({ type, x1, y1, x2, y2, stroke }: Element) => {
      position = positionWithinShape(
        clientX,
        clientY,
        x1,
        y1,
        x2 as number,
        y2 as number,
        type as Shapes,
        stroke
      );
      return position !== null;
    }
  );

  console.log("Found Element Position is ", position);

  return {
    ...(foundElement || {}),
    selectedPosition: position,
  };
};

export const positionWithinShape = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: Shapes,
  stroke?: number[][]
): SelectedPosition => {
  switch (type) {
    case "rectangle":
      return positionOnRectangle(clientX, clientY, x1, y1, x2, y2);
    case "line":
      return positionOnLine(
        point(clientX, clientY),
        point(x1, y1),
        point(x2, y2)
      );
    case "freehand":
      console.log("Get the stroke", stroke);
      return positionOnPencil(point(clientX, clientY), stroke as number[][]);
    case "text":
      return clientX >= x1 && clientY >= y1 && clientX <= x2 && clientY <= y2
        ? "inside"
        : null;
    default:
      return null;
  }
};

export const nearPoint = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  return Math.abs(x2 - x1) < 10 && Math.abs(y2 - y1) < 10;
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

export const positionOnLine = (
  clientPoint: Point,
  a: Point,
  b: Point
): SelectedPosition => {
  const offset =
    distance(a, b) - distance(a, clientPoint) - distance(b, clientPoint);
  const inside = Math.abs(offset) < 1 ? "inside" : null;

  const start = nearPoint(clientPoint.x, clientPoint.y, a.x, a.y)
    ? "start"
    : null;
  const end = nearPoint(clientPoint.x, clientPoint.y, b.x, b.y) ? "end" : null;
  return inside || start || end;
};

export const distance = (a: Point, b: Point): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const point = (x: number, y: number): Point => ({ x, y });
