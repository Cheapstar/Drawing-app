import { FreehandElement, Point } from "@/types/types";

import { adjustElementCoordinates } from "@/Geometry/utils";

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
      x1: newX1 as number,
      y1: newY1 as number,
      x2: newX2 as number,
      y2: newY2 as number,
    });

    return;
  }

  const {
    x1,
    y1,
    x2,
    y2,
    selectedPosition,
    originalStroke,
    stroke,
  }: FreehandElement = selectedElement;

  let updatedStrokes = stroke;

  const width = (x2 as number) - x1;
  const height = (y2 as number) - y1;

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

  let scaleX = 1,
    scaleY = 1;
  let newX1 = x1,
    newY1 = y1,
    newX2 = x2,
    newY2 = y2;
  let referenceX = x1,
    referenceY = y1; // Default reference point

  switch (selectedPosition) {
    case "b":
      scaleY = height !== 0 ? (client.y - y1) / height : 1;
      referenceY = y1;
      newY2 = client.y;
      break;

    case "t":
      scaleY = height !== 0 ? ((y2 as number) - client.y) / height : 1;
      referenceY = y2 as number;
      newY1 = client.y;
      break;

    case "l":
      scaleX = width !== 0 ? ((x2 as number) - client.x) / width : 1;
      referenceX = x2 as number;
      newX1 = client.x;
      break;

    case "r":
      scaleX = width !== 0 ? (client.x - x1) / width : 1;
      referenceX = x1;
      newX2 = client.x;
      break;
    case "start":
    case "tl":
      scaleX = width !== 0 ? ((x2 as number) - client.x) / width : 1;
      scaleY = height !== 0 ? ((y2 as number) - client.y) / height : 1;
      referenceX = x2 as number;
      referenceY = y2 as number;
      newX1 = client.x;
      newY1 = client.y;
      break;

    case "tr":
      scaleX = width !== 0 ? (client.x - x1) / width : 1;
      scaleY = height !== 0 ? ((y2 as number) - client.y) / height : 1;
      referenceX = x1;
      referenceY = y2 as number;
      newX2 = client.x;
      newY1 = client.y;
      break;

    case "bl":
      scaleX = width !== 0 ? ((x2 as number) - client.x) / width : 1;
      scaleY = height !== 0 ? (client.y - y1) / height : 1;
      referenceX = x2 as number;
      referenceY = y1;
      newX1 = client.x;
      newY2 = client.y;
      break;

    case "end":
    case "br":
      scaleX = width !== 0 ? (client.x - x1) / width : 1;
      scaleY = height !== 0 ? (client.y - y1) / height : 1;
      referenceX = x1;
      referenceY = y1;
      newX2 = client.x;
      newY2 = client.y;
      break;
  }

  updatedStrokes = scaleStroke(stroke, scaleX, scaleY, referenceX, referenceY);

  setSelectedElement({
    ...selectedElement,
    x1: newX1,
    y1: newY1,
    x2: newX2,
    y2: newY2,
    stroke: updatedStrokes,
  });
}
