import { DEFAULT_STROKE_OPTIONS } from "@/Constants";
import getStroke from "perfect-freehand";
import rough from "roughjs";
import {
  Element,
  FreehandElement,
  LineElement,
  RectangleElement,
  Shapes,
} from "@/types/types";
import { Config } from "roughjs/bin/core";

const options: Config = {
  roughness: 1, // Lower for less roughness
  bowing: 0.5, // How much the lines bow
  disableMultiStroke: true, // For cleaner, single stroke elements
  seed: 42,
};

const generator = rough.generator(options);

export const createRectangle = (element: RectangleElement) => {
  console.log("Element is :", element);
  const width = element.x2 - element.x1;
  const height = element.y2 - element.y1;
  const roughElement = generator.rectangle(
    element.x1,
    element.y1,
    width,
    height,
    {
      stroke: element.color,
      strokeWidth: (element.strokeWidth as number) / 8,
      ...options,
    }
  );
  return roughElement;
};

export const createLine = (element: LineElement) => {
  const roughElement = generator.line(
    element.x1,
    element.y1,
    element.x2,
    element.y2,
    {
      stroke: element.color,
      strokeWidth: (element.strokeWidth as number) / 8,
      ...options,
    }
  );
  return roughElement;
};

export const createFreeHand = (element: FreehandElement) => {
  console.log("In FreeHand", element.stroke);

  const path = new Path2D();
  const outline = getStroke(element.stroke, {
    ...DEFAULT_STROKE_OPTIONS,
    size: element.strokeWidth,
  });

  if (outline.length < 2)
    return {
      path,
      x1: outline[0][0],
      y1: outline[0][1],
      x2: outline[0][0],
      y2: outline[0][1],
    };

  path.moveTo(outline[0][0], outline[0][1]);

  let minX = outline[0][0];
  let maxX = outline[0][0];
  let minY = outline[0][1];
  let maxY = outline[0][1];

  // Draw smooth curves through points
  for (let i = 1; i < outline.length - 1; i++) {
    const xc = (outline[i][0] + outline[i + 1][0]) / 2;
    const yc = (outline[i][1] + outline[i + 1][1]) / 2;
    path.quadraticCurveTo(outline[i][0], outline[i][1], xc, yc);

    // updating the min's and max's
    minX = Math.min(outline[i][0], minX);
    maxX = Math.max(outline[i][0], maxX);
    minY = Math.min(outline[i][1], minY);
    maxY = Math.max(outline[i][1], maxY);
  }

  path.closePath();
  return path;
};

export const adjustElementCoordinates = (
  type: Shapes,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { newX1: number; newY1: number; newX2: number; newY2: number } => {
  if (type === "rectangle") {
    const MinX = Math.min(x1 ?? 0, x2 ?? 0);
    const MaxX = Math.max(x1 ?? 0, x2 ?? 0);
    const MinY = Math.min(y1 ?? 0, y2 ?? 0);
    const MaxY = Math.max(y1 ?? 0, y2 ?? 0);

    return {
      newX1: MinX,
      newY1: MinY,
      newX2: MaxX,
      newY2: MaxY,
    };
  } else {
    if (x1 < x2 || (x2 === x1 && y1 < y2)) {
      return {
        newX1: x1,
        newY1: y1,
        newX2: x2,
        newY2: y2,
      };
    } else {
      return {
        newX1: x2 ?? x1,
        newY1: y2 ?? y1,
        newX2: x1,
        newY2: y1,
      };
    }
  }
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
    case Shapes.Ellipse:
    case Shapes.Line:
    case Shapes.Arrow:
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
