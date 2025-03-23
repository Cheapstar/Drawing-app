import { LineElement, Point } from "@/types/types";

export function handleLineMoveAction(
  client: Point,
  selectedElement: LineElement,
  setSelectedElement: (ele: LineElement) => void
) {
  if (selectedElement.type === "line" && selectedElement.isSelected) {
    const { x1, y1, x2, y2, offsetX, offsetY, controlPoint } =
      selectedElement as LineElement;

    const newX1 = client.x - (offsetX as number[])[0];
    const newY1 = client.y - (offsetY as number[])[0];
    const newX2 = newX1 + x2 - x1;
    const newY2 = newY1 + y2 - y1;
    const newControlPoint = {
      x: (controlPoint as Point).x + newX1 - x1,
      y: (controlPoint as Point).y + newY1 - y1,
    };

    setSelectedElement({
      ...selectedElement,
      x1: newX1,
      y1: newY1,
      x2: newX2,
      y2: newY2,
      controlPoint: newControlPoint,
    });
    return;
  } else {
    const { x1, y1, x2, y2, controlPoint, offsetX, offsetY } =
      selectedElement as LineElement;

    const width = x2 - x1;
    const height = y2 - y1;
    const newX1 = client.x - (offsetX as number[])[0];
    const newY1 = client.y - (offsetY as number[])[0];
    const newX2 = newX1 + width;
    const newY2 = newY1 + height;
    const newControlPoint = {
      x: (controlPoint as Point).x + newX1 - x1,
      y: (controlPoint as Point).y + newY1 - y1,
    };

    setSelectedElement({
      ...selectedElement,
      x1: newX1,
      y1: newY1,
      x2: newX2,
      y2: newY2,
      controlPoint: newControlPoint,
    });

    return;
  }
}
