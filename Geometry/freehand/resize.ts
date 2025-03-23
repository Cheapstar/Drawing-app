import { BoundingElement, FreehandElement, Point } from "@/types/types";
import { getTheBoundingElement } from "../elements/boundingElement";
import { PADDING } from "@/Constants";
import { adjustElementCoordinates } from "@/components/utils/elements";

export function handleFreehandResize(
  client: Point,
  selectedElement: FreehandElement,
  setSelectedElement: (ele: FreehandElement) => void
) {
  if (!selectedElement.selectedPosition || !selectedElement.originalStroke)
    return;

  if (selectedElement.stroke.length < 11) {
    const updatedStrokes = [...selectedElement.stroke, [client.x, client.y]];

    const { newX1, newY1, newX2, newY2 } =
      adjustElementCoordinates(selectedElement);

    setSelectedElement({
      ...selectedElement,
      stroke: updatedStrokes,
      originalStroke: updatedStrokes,
      x1: newX1,
      y1: newY1,
      x2: newX2,
      y2: newY2,
    });

    return;
  }

  const { x1, x2, y1, y2, type, selectedPosition, originalStroke } =
    selectedElement;

  console.log("Selected Element", selectedElement);

  // Calculate width and height
  const width = x2 - x1;
  const height = y2 - y1;

  let scaleX = 1,
    scaleY = 1;
  let referenceX = x1,
    referenceY = y1;

  let newX1 = x1,
    newY1 = y1,
    newX2 = x2,
    newY2 = y2;

  // Calculate scaling based on the selected position
  switch (selectedPosition) {
    case "b":
      scaleY = height ? (client.y - y1) / height : 1;
      referenceY = y1;
      newY2 = client.y;
      break;

    case "t":
      scaleY = height ? (y2 - client.y) / height : 1;
      referenceY = y2;
      newY1 = client.y;
      break;

    case "l":
      scaleX = width ? (x2 - client.x) / width : 1;
      referenceX = x2;
      newX1 = client.x;
      break;

    case "r":
      scaleX = width ? (client.x - x1) / width : 1;
      referenceX = x1;
      newX2 = client.x;
      break;

    case "tl":
      scaleX = width ? (x2 - client.x) / width : 1;
      scaleY = height ? (y2 - client.y) / height : 1;
      referenceX = x2;
      referenceY = y2;
      newX1 = client.x;
      newY1 = client.y;
      break;

    case "tr":
      scaleX = width ? (client.x - x1) / width : 1;
      scaleY = height ? (y2 - client.y) / height : 1;
      referenceX = x1;
      referenceY = y2;
      newX2 = client.x;
      newY1 = client.y;
      break;

    case "bl":
      scaleX = width ? (x2 - client.x) / width : 1;
      scaleY = height ? (client.y - y1) / height : 1;
      referenceX = x2;
      referenceY = y1;
      newX1 = client.x;
      newY2 = client.y;
      break;

    case "br":
      scaleX = width ? (client.x - x1) / width : 1;
      scaleY = height ? (client.y - y1) / height : 1;
      referenceX = x1;
      referenceY = y1;
      newX2 = client.x;
      newY2 = client.y;
      break;
  }

  let updatedStrokes;

  if (type === "freehand") {
    // Always scale from the original stroke to prevent cumulative distortion
    updatedStrokes = scaleStroke(
      originalStroke,
      scaleX,
      scaleY,
      referenceX,
      referenceY
    );
  }

  // Calculate original bounding box from original stroke
  const originalBounds = calculateBounds(originalStroke);

  // Calculate new bounding box based on the new dimensions
  const newWidth = newX2 - newX1;
  const newHeight = newY2 - newY1;

  // Calculate scale ratios from original bounds to new dimensions
  const finalScaleX = newWidth / (originalBounds.maxX - originalBounds.minX);
  const finalScaleY = newHeight / (originalBounds.maxY - originalBounds.minY);

  // Scale the original stroke to fit the new bounding box
  const finalStroke = scaleStrokeToFit(
    originalStroke,
    newX1,
    newY1,
    finalScaleX,
    finalScaleY,
    originalBounds
  );

  setSelectedElement({
    ...selectedElement,
    stroke: finalStroke,
    x1: newX1,
    y1: newY1,
    x2: newX2,
    y2: newY2,
  });
}

function calculateBounds(stroke: number[][]) {
  if (!stroke.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of stroke) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { minX, minY, maxX, maxY };
}

function scaleStrokeToFit(
  stroke: number[][],
  newX1: number,
  newY1: number,
  scaleX: number,
  scaleY: number,
  originalBounds: { minX: number; minY: number; maxX: number; maxY: number }
) {
  const { minX, minY } = originalBounds;

  return stroke.map(([px, py]) => [
    newX1 + (px - minX) * scaleX,
    newY1 + (py - minY) * scaleY,
  ]);
}

function scaleStroke(
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
