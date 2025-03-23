/* eslint-disable @typescript-eslint/no-unused-vars */
import { getPositionOnBoundingBox, point } from "@/components/utils/position";
import {
  BoundingElement,
  Action,
  Point,
  RectangleElement,
} from "@/types/types";
import { getTheOffsets } from "../utils";

export function handleRectBoundingBoxSelection(
  client: Point,
  selectedElement: RectangleElement,
  boundingElement: BoundingElement,
  setSelectedElement: (ele: RectangleElement) => void,
  setBoundingElement: (ele: BoundingElement) => void,
  setAction: (act: Action) => void,
  scale: number
) {
  // Check if it is inside the bounding box
  // if yes where it is and set the selected position

  const selectedPos = getPositionOnBoundingBox(
    boundingElement,
    point(client.x, client.y)
  );

  if (selectedPos != "none") {
    if (selectedPos === "inside") {
      const offset = getTheOffsets(selectedElement, point(client.x, client.y));

      setBoundingElement({
        ...boundingElement,
        selectedPosition: selectedPos,
        isSelected: true,
        offsetX: offset.x,
        offsetY: offset.y,
      });
      setSelectedElement({
        ...selectedElement,
        isSelected: false,
      });
      setAction("moving");
    } else {
      setBoundingElement({
        ...boundingElement,
        selectedPosition: selectedPos,
        isSelected: true,
      });
      setSelectedElement({
        ...selectedElement,
        isSelected: false,
      });
      setAction("resizing");
    }
  }
}
