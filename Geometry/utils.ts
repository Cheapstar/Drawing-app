import {
  Point,
  Element,
  LineElement,
  RectangleElement,
  TextElement,
  FreehandElement,
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
      return checkOnFreehand(client, element, scale as number) as boolean;
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

export function getTheOffsets(elementAtPosition: Element, client: Point) {
  const offsetX = [];
  const offsetY = [];

  switch (elementAtPosition.type) {
    case "rectangle":
    case "line":
    case "text":
      console.log("Setting up the offsets");
      offsetX.push(client.x - (elementAtPosition.x1 as number));
      offsetY.push(client.y - (elementAtPosition.y1 as number));
      break;
    case "freehand":
      const freehandElement = elementAtPosition as FreehandElement;
      for (let i = 0; i < freehandElement.stroke.length; i++) {
        offsetX.push(client.x - freehandElement.stroke[i][0]);
        offsetY.push(client.y - freehandElement.stroke[i][1]);
      }
      break;
  }

  return {
    x: offsetX,
    y: offsetY,
  };
}

export function expandCanvasOnDrag(
  event: React.PointerEvent<HTMLCanvasElement>, // Event to track pointer position
  boardRef: React.RefObject<HTMLCanvasElement>,
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>,
  threshold: number = 5, // How close to the edge before expanding
  expandBy: number = 10 // How much to translate when near an edge
) {
  if (!boardRef.current) return;

  const canvas = boardRef.current;
  const { clientWidth: width, clientHeight: height } = canvas;
  const { clientX, clientY } = event;

  let deltaX = 0;
  let deltaY = 0;

  console.log(width, clientX);

  // Detect if cursor is near the edges
  if (clientX <= threshold) deltaX = -expandBy; // Left edge
  if (clientX >= width - threshold) deltaX = expandBy; // Right edge
  if (clientY <= threshold) deltaY = -expandBy; // Top edge
  if (clientY >= height - threshold) deltaY = expandBy; // Bottom edge

  // Apply translation offset
  setPanOffset((prev) => ({
    x: prev.x - deltaX,
    y: prev.y - deltaY,
  }));
}

export const adjustElementCoordinates = (element: Element) => {
  const { type } = element;
  if (type === "line") {
    const { x1, x2, y1, y2, isCurved } = element as LineElement;

    // For straight lines
    if (!isCurved) {
      // When line is drawn from left to right or
      // from top to bottom and it is vertical
      if (x1 < x2 || (x2 === x1 && y1 < y2)) {
        return {
          newX1: x1,
          newY1: y1,
          newX2: x2,
          newY2: y2,
        };
      } else {
        // if line drawn from right to left or
        // bottom to top
        return {
          newX1: x2,
          newY1: y2,
          newX2: x1,
          newY2: y1,
        };
      }
    }
    // For curved lines (quadratic bezier)
    else {
      // y jiska chota hoga wo upar
      const newY1 = Math.min(y1, y2);
      const newY2 = Math.max(y1, y2);
      return {
        newX1: y1 < y2 ? x1 : x2,
        newY1: newY1,
        newX2: y1 < y2 ? x2 : x1,
        newY2: newY2,
      };
    }
  } else if (type === "rectangle") {
    const { x1, x2, y1, y2 } = element as RectangleElement;

    return {
      newX1: Math.min(x1, x2),
      newX2: Math.max(x1, x2),
      newY1: Math.min(y1, y2),
      newY2: Math.max(y1, y2),
    };
  } else if (type === "freehand") {
    // Initialize with extreme values or first point if available
    if (!element.stroke.length) {
      return { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 };
    }

    if (element.stroke.length === 1) {
      console.log("Here is the Bounding Box");
      return {
        x1: element.stroke[0][0],
        y1: element.stroke[0][1],
        x2: element.stroke[0][0],
        y2: element.stroke[0][1],
        width: 10,
        height: 10,
      };
    }

    let minX = element.stroke[0][0];
    let maxX = element.stroke[0][0];
    let minY = element.stroke[0][1];
    let maxY = element.stroke[0][1];

    // Loop through all points to find min/max values
    for (const [x, y] of element.stroke) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    return {
      newX1: minX,
      newY1: minY,
      newX2: maxX,
      newY2: maxY,
    };
  } else if (type === "text") {
    const { x1, y1, height, width } = element as TextElement;

    const newX1 = x1,
      newX2 = x1 + width,
      newY1 = y1,
      newY2 = y1 + height;

    return {
      newX1,
      newY1,
      newX2,
      newY2,
    };
  }

  // Return the original element if it's not a line
  return element;
};

export function convertElements(
  elements: Element[],
  boardRef: React.RefObject<HTMLCanvasElement>
) {
  return elements.map((ele) => convertElement(ele, boardRef));
}

export function convertElement(
  element: Element,
  boardRef: React.RefObject<HTMLCanvasElement>
) {
  const { type } = element;
  if (type === "line") {
    const { x1, y1, x2, y2, type } = element as LineElement;
    const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
      element as Element
    );

    return {
      ...element,
      ...{
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
        controlPoint: {
          x: ((newX1 as number) + (newX2 as number)) / 2,
          y: ((newY1 as number) + (newY2 as number)) / 2,
        },
      },
    };
  } else if (type === "rectangle") {
    const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
      element as RectangleElement
    );

    return {
      ...element,
      ...{
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
      },
    };
  } else if (type === "freehand") {
    const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
      element as FreehandElement
    );

    return {
      ...element,
      ...{
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
      },
    };
  } else {
    const { x1, y1, text, fontSize, fontFamily } = element;
    const ctx = boardRef.current.getContext("2d");
    if (!ctx) return false;

    console.log("Text is", text);

    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;

    const lines = text?.split("\n") as string[];

    // Find the longest line for width calculation
    const longestLine = lines.reduce((a, b) =>
      ctx.measureText(a).width > ctx.measureText(b).width ? a : b
    );

    const textWidth = ctx.measureText(longestLine).width;
    const textHeight = (fontSize as number) * lines.length * 1.5; // Approximate line height

    const x2 = x1 + textWidth;
    const y2 = y1 + textHeight;

    ctx.restore();
    return {
      ...element,
      x1,
      x2,
      y1,
      y2,
      width: textWidth,
      height: textHeight,
    };
  }
}

/*
  We Can Run This Function At Regular Interval
*/
