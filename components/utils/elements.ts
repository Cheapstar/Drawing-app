import { Element, LineElement, RectangleElement, Shapes } from "@/types/types";
import { quadraticBezierMidpoint } from "./position";

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
  }

  // Return the original element if it's not a line
  return element;
};

export function scaleStroke(
  stroke: number[][],
  scaleX: number,
  scaleY: number,
  originX: number,
  originY: number
) {
  return stroke.map(([px, py]) => [
    originX + (px - originX) * scaleX,
    originY + (py - originY) * scaleY,
  ]);
}

// Get bounding box for any element type
export function getElementBoundingBox(element: Element, scale: number) {
  switch (element.type) {
    case Shapes.Rectangle:
    case Shapes.Line:
      // For shapes with x1, y1, x2, y2 properties
      const x1 = Math.min(element.x1, element.x2);
      const y1 = Math.min(element.y1, element.y2);
      const x2 = Math.max(element.x1, element.x2);
      const y2 = Math.max(element.y1, element.y2);
      return {
        x1: x1 - 15 * scale,
        y1: y1 - 15 * scale,
        x2: x2 + 15 * scale,
        y2: y2 + 15 * scale,
        width: x2 - x1 + 30 * scale,
        height: y2 - y1 + 30 * scale,
      };

    case Shapes.Freehand:
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
        x1: minX,
        y1: minY,
        x2: maxX,
        y2: maxY,
        width: maxX - minX,
        height: maxY - minY,
      };

    case Shapes.Text:
      // For text elements, we need to consider the font metrics
      // This is an approximate calculation, as actual text measurements
      // would require canvas context
      const textWidth =
        (element.text?.length as number) * (element.fontSize || 16) * 0.6 || 0;
      const textHeight = (element.fontSize || 16) * 1.2;
      return {
        x1: element.x1,
        y1: element.y1,
        x2: element.x1 + textWidth,
        y2: element.y1 + textHeight,
        width: textWidth,
        height: textHeight,
      };

    default:
      // Fallback for any unhandled types
      return { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 };
  }
}

export function drawHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
) {
  const handleSize = 8;
  ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
  ctx.roundRect(
    x - handleSize / 2,
    y - handleSize / 2,
    handleSize,
    handleSize,
    [2]
  );
  ctx.stroke();
}

export function getTheBoundingBox(element: Element, scale: number) {
  const { type } = element;

  if (type === "line") {
    return lineBoundingBox(element, scale);
  }
}

export function lineBoundingBox(element: LineElement, scale: number) {
  if (!element.isCurved) return null;

  const midPoints = quadraticBezierMidpoint(element);
  const x1 = Math.min(element.x1, element.x2, midPoints.x);
  const y1 = Math.min(element.y1, element.y2, midPoints.y);
  const x2 = Math.max(element.x1, element.x2, midPoints.x);
  const y2 = Math.max(element.y1, element.y2, midPoints.y);

  const padding = 8;

  return {
    x1,
    x2,
    y1,
    y2,
    padding,
    type: "line",
    strokeWidth: element.strokeWidth,
  };
}
