import { getElementAtPosition } from "@/Geometry/utils";
import { Point, Element, Action } from "@/types/types";

export function handleEraser(
  client: Point,
  selectedElement: Element,
  elements: Element[],
  eraseElements: Element[],
  setSelectedElement: (ele: Element | null) => void,
  setEraseElements: (arr: Element[]) => void,
  setAction: (ele: Action) => void,
  updateElement: (
    index: number,
    elementProps: Partial<Element> & { id: string }
  ) => void,
  scale: number,
  boardRef: React.RefObject<HTMLCanvasElement>
) {
  setSelectedElement(null);
  const element = getElementAtPosition(
    client.x,
    client.y,
    elements,
    scale,
    boardRef
  );
  console.log("Erased Element", element);

  setAction("erasing");
  if (element) {
    const index = elements.findIndex(({ id }) => id === element.id);

    if (index !== -1) {
      // Add to eraseElements if not already there
      if (!eraseElements.some((e) => e.id === element.id)) {
        setEraseElements([...eraseElements, element as Element]);

        // Update opacity to show it's being erased
        updateElement(index, {
          ...element,
          opacity: 0.5,
          id: element.id as string,
        });
      }
    }
  }
}

export function handleEraserMove(
  client: Point,
  elements: Element[],
  eraseElements: Element[],
  setEraseElements: (arr: Element[]) => void,
  updateElement: (
    index: number,
    elementProps: Partial<Element> & { id: string }
  ) => void,
  scale: number,
  boardRef: React.RefObject<HTMLCanvasElement>
) {
  const element = getElementAtPosition(
    client.x,
    client.y,
    elements,
    scale,
    boardRef
  );

  console.log("Element to be erased is", element);

  if (element) {
    const index = elements.findIndex(({ id }) => id === element.id);
    if (index !== -1) {
      const fullElement = elements[index];
      if (!eraseElements.some((e) => e.id === element.id)) {
        setEraseElements([...eraseElements, fullElement]);
        updateElement(index, {
          ...fullElement,
          opacity: 0.5,
          id: fullElement.id,
        });
      }
    }
  }
}

export function finalizeErasing(
  elements: Element[],
  eraseElements: Element[],
  setSelectedElement: (ele: Element | null) => void,
  setEraseElements: (arr: Element[]) => void,
  setAction: (ele: Action) => void,
  setElements: (ele: Element[]) => void
) {
  if (eraseElements.length === 0) {
    setAction("none");
    return;
  }

  const newElements = elements.filter(
    (element) =>
      !eraseElements.some((eraseElement) => eraseElement.id === element.id)
  );

  setElements(newElements);
  setEraseElements([]);
  setSelectedElement(null);
  setAction("none");
}
