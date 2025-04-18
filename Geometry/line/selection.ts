import { getTheOffsets } from "../utils";
import { checkOnline, selectedPositionOnLine } from "./position";
import { Action, LineElement, Point, SelectedPosition } from "@/types/types";

export function handleLineSelection(
  client: Point,
  selectedElement: LineElement,
  setSelectedElement: (ele: LineElement | null) => void,
  setAction: (act: Action) => void,
  scale: number
) {
  const result = selectedPositionOnLine(selectedElement, client, scale);

  if (result) {
    setSelectedElement({
      ...selectedElement,
      isSelected: true,
      selectedPosition: result as SelectedPosition,
    });

    setAction("resizing");
    return true;
  } else if (checkOnline(client, selectedElement, scale)) {
    const offset = getTheOffsets(selectedElement, client);

    setSelectedElement({
      ...selectedElement,
      offsetX: offset.x,
      offsetY: offset.y,
      isSelected: true,
    });
    setAction("moving");
    return true;
  } else {
    setSelectedElement(null);
    return false;
  }
}
