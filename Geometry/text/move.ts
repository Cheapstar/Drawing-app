import { Point, TextElement } from "@/types/types";

export function handleTextMove(
  client: Point,
  selectedElement: TextElement,
  setSelectedElement: (ele: TextElement) => void
) {
  const { height, width, offsetX, offsetY } = selectedElement;

  const newX1 = client.x - (offsetX as number[])[0];
  const newY1 = client.y - (offsetY as number[])[0];
  const newX2 = newX1 + width;
  const newY2 = newY1 + height;

  setSelectedElement({
    ...selectedElement,
    x1: newX1,
    y1: newY1,
    x2: newX2,
    y2: newY2,
  });
}
