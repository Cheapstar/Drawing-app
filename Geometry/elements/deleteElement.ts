import { Element } from "@/types/types";

export function deleteElement(
  elements: Element[],
  selectedElement: Element,
  setSelectedElement: (ele: Element | null) => void,
  setElements: (ele: Element[]) => void
) {
  const newElements = elements.filter(
    (element) => !(selectedElement.id === element.id)
  );

  setElements(newElements);
  setSelectedElement(null);
}
