/*
    Changing the Approach :-
        if - no element is selected :
            1. Check element at position 
            2. Select element at that position
            3. Set the Bounding Element (bounding element will be quadrilateral most of the time, apart from line)
            4. Then move to next step 
        
        else if element is selected 
        1. First check within the bounding box , is it inside or on the bounding box 
            if - yes
                then go with that 
        2. If it is not within the bounding box then selected element is equal to null



        */

import { getElementAtPosition } from "@/Geometry/utils";
import { Action, Element, Point } from "@/types/types";
import { positionWithinBoundingElement } from "./position";
import { getTheOffsets } from "../utils";
import { handleLineSelection } from "../line/selection";

export function handleElementSelection(
  client: Point,
  selectedElement: Element,
  elements: Element[],
  setSelectedElement: (ele: Element | null) => void,
  setAction: (act: Action) => void,
  scale: number,
  boardRef: React.RefObject<HTMLCanvasElement>
) {
  console.log("Selected Element is", selectedElement);

  const elementAtPosition = getElementAtPosition(
    client.x,
    client.y,
    elements,
    scale,
    boardRef
  );
  // element exists but no element is selected or different element is getting selected
  if (
    elementAtPosition &&
    (!selectedElement ||
      (elementAtPosition as Element).id != selectedElement.id)
  ) {
    setSelectedElement(elementAtPosition as Element);
  } else if (!selectedElement && !elementAtPosition) {
    return;
  } else {
    if (
      selectedElement.type === "line" &&
      handleLineSelection(
        client,
        selectedElement,
        setSelectedElement,
        setAction,
        scale
      )
    ) {
      return;
    }

    if (
      selectedElement &&
      (selectedElement.type === "freehand" ||
        selectedElement.type == "rectangle" ||
        (selectedElement.type === "line" && selectedElement.isCurved) ||
        selectedElement.type === "text")
    ) {
      // check if it is inside or on the edges or corner
      const selectedPos = positionWithinBoundingElement(
        client,
        selectedElement,
        boardRef.current.getContext("2d") as CanvasRenderingContext2D,
        scale
      );

      console.log("Selected Pos is", selectedElement);

      if (selectedPos != "none") {
        if (selectedPos === "inside") {
          const offset = getTheOffsets(selectedElement, client);

          console.log("Moving");
          setSelectedElement({
            ...selectedElement,
            selectedPosition: "inside",
            offsetX: offset.x,
            offsetY: offset.y,
            isSelected: true,
          });
          setAction("moving");
        } else {
          setSelectedElement({
            ...selectedElement,
            selectedPosition: selectedPos,
            isSelected: true,
          });

          setAction("resizing");
        }
      } else {
        setSelectedElement(null);
      }
    }
  }
}
