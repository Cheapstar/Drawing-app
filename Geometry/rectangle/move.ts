import { Point, RectangleElement } from "@/types/types";

export function handleRectMoveAction(
  client: Point,
  selectedElement: RectangleElement,
  setSelectedElement: (ele: RectangleElement) => void
) {
  const { x1, y1, x2, y2, offsetX, offsetY } = selectedElement;

  const width = x2 - x1;
  const height = y2 - y1;
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
