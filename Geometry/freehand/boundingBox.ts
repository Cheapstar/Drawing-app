/* eslint-disable @typescript-eslint/no-unused-vars */
import { getPositionOnBoundingBox } from "@/components/utils/position";
import { Action, BoundingElement, FreehandElement, Point } from "@/types/types";
import { getTheOffsets } from "../utils";

export function handleFreehandBoundingBoxSelection(
  client: Point,
  selectedElement: FreehandElement,
  boundingElement: BoundingElement,
  setSelectedElement: (ele: FreehandElement) => void,
  setBoundingElement: (ele: BoundingElement) => void,
  setAction: (act: Action) => void,
  scale: number
) {
  let minX = selectedElement.stroke[0][0];
  let maxX = selectedElement.stroke[0][0];
  let minY = selectedElement.stroke[0][1];
  let maxY = selectedElement.stroke[0][1];

  // Loop through all points to find min/max values
  for (const [x, y] of selectedElement.stroke) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const selectedPos = getPositionOnBoundingBox(
    {
      ...boundingElement,
      x1: minX,
      x2: maxX,
      y1: minY,
      y2: maxY,
    },
    client
  );

  if (selectedPos != "none") {
    if (selectedPos === "inside") {
      const offset = getTheOffsets(selectedElement, client);

      setSelectedElement({
        ...selectedElement,
        isSelected: false,
      });

      setBoundingElement({
        ...boundingElement,
        x1: minX,
        x2: maxX,
        y1: minY,
        y2: maxY,
        offsetX: offset.x,
        offsetY: offset.y,
        isSelected: true,
      });

      setAction("moving");
    } else {
      setSelectedElement({
        ...selectedElement,
        isSelected: false,
      });

      console.log("Selected Position Freehand is", selectedPos);
      setBoundingElement({
        ...boundingElement,
        x1: minX,
        x2: maxX,
        y1: minY,
        y2: maxY,
        isSelected: true,
        selectedPosition: selectedPos,
      });

      setAction("resizing");
    }
  }
}
