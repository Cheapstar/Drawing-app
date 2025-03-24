import { Action, Element, Point } from "@/types/types";
import { handleFreehandResize } from "../freehand/resize";
import { handleLineResize } from "../line/resize";
import { handleRectResize } from "../rectangle/resize";
import { adjustElementCoordinates } from "@/components/utils/elements";
import { handleTextResize } from "../text/resize";

export function handleElementResize(
  client: Point,
  selectedElement: Element,
  setSelectedElement: (ele: Element) => void
) {
  // All for line
  switch (selectedElement.type) {
    case "text":
      handleTextResize(client, selectedElement, setSelectedElement);
      return;
    case "line":
      handleLineResize(client, selectedElement, setSelectedElement);
      return;
    case "rectangle":
      handleRectResize(client, selectedElement, setSelectedElement);
      return;
    case "freehand":
      handleFreehandResize(client, selectedElement, setSelectedElement);
      return;
  }
}

export function finalizeResizeAndMoving(
  selectedElement: Element,
  elements: Element[],
  setSelectedElement: (ele: Element | null) => void,
  setAction: (ele: Action) => void,
  setElements: (ele: Element[]) => void
) {
  const index = elements.findIndex(
    (element) => element.id === selectedElement.id
  );

  if (index !== -1) {
    // Create a copy of the elements array
    const updatedElements = [...elements];

    const { newX1, newY1, newX2, newY2 } =
      adjustElementCoordinates(selectedElement);
    // Replace the element at the index with the selectedElement
    updatedElements[index] = {
      ...selectedElement,
      x1: newX1 as number,
      y1: newY1 as number,
      x2: newX2 as number,
      y2: newY2 as number,
    };
    setSelectedElement({
      ...selectedElement,
      x1: newX1 as number,
      y1: newY1 as number,
      x2: newX2 as number,
      y2: newY2 as number,
    });

    // Update the elements state
    setElements(updatedElements);
  }
  setAction("none");
}
