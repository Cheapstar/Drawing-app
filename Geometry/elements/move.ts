import { Point, Element } from "@/types/types";
import { handleFreehandMoveAction } from "../freehand/move";
import { handleLineMoveAction } from "../line/move";
import { handleRectMoveAction } from "../rectangle/move";
import { handleTextMove } from "../text/move";
import { handleImageMove } from "../images/move";

export function handleElementMove(
  client: Point,
  selectedElement: Element,
  setSelectedElement: (ele: Element) => void
) {
  // All for line
  switch (selectedElement.type) {
    case "line":
      handleLineMoveAction(client, selectedElement, setSelectedElement);
      return;
    case "rectangle":
      handleRectMoveAction(client, selectedElement, setSelectedElement);
      return;
    case "freehand":
      handleFreehandMoveAction(client, selectedElement, setSelectedElement);
      return;
    case "text":
      handleTextMove(client, selectedElement, setSelectedElement);
      return;
    case "image":
      handleImageMove(client, selectedElement, setSelectedElement);
      return;
  }
}
