import { getTheBoundingBox } from "@/components/utils/elements";
import { getPositionOnBoundingBox } from "@/components/utils/position";
import { Action, BoundingElement, LineElement, Point } from "@/types/types";
import { getTheOffsets } from "../utils";

export function handleLineBoundingBoxSelection(
  client: Point,
  selectedElement: LineElement,
  setSelectedElement: (ele: LineElement) => void,
  setBoundingElement: (ele: BoundingElement) => void,
  setAction: (act: Action) => void,
  scale: number
) {
  // check if it is inside the bounding zone
  // This runs when click is on the bounding box not on the selectedElement

  const boundingBox = getTheBoundingBox(selectedElement, scale);
  const posOnBoundingBox = getPositionOnBoundingBox(
    boundingBox as BoundingElement,
    client
  );

  // if client is on Bounding Box then we need to do something
  console.log("Element inside Bounding Box is", selectedElement);
  // Based on its position
  if (posOnBoundingBox != "none") {
    if (posOnBoundingBox === "inside") {
      // get the offset for moving
      const offset = getTheOffsets(selectedElement, client);
      setBoundingElement({
        ...boundingBox,
        selectedPosition: posOnBoundingBox,
        offsetX: offset.x,
        offsetY: offset.y,
        isSelected: true,
      } as BoundingElement);

      setSelectedElement({
        ...selectedElement,
        isSelected: false,
        selectedPosition: null,
      });
      setAction("moving");
      return;
    } else {
      setBoundingElement({
        ...boundingBox,
        selectedPosition: posOnBoundingBox,
        isSelected: true,
      } as BoundingElement);
      setSelectedElement({
        ...selectedElement,
        isSelected: false,
        selectedPosition: null,
      });
      setAction("resizing");
      return;
    }
  }
}
