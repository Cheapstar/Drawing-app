import { Point, RectangleElement } from "@/types/types";

export function handleRectResize(
  client: Point,
  selectedElement: RectangleElement,
  setSelectedElement: (ele: RectangleElement) => void
) {
  if (selectedElement.type === "rectangle") {
    const { x1, x2, y1, y2, selectedPosition } = selectedElement;

    let newX1 = x1,
      newX2 = x2,
      newY1 = y1,
      newY2 = y2;

    // Handle edge positions
    switch (selectedPosition) {
      case "b":
        newY2 = client.y;
        break;
      case "t":
        newY1 = client.y;
        break;
      case "l":
        newX1 = client.x;
        break;
      case "r":
        newX2 = client.x;
        break;
      // Add corner positions
      case "tl":
        newX1 = client.x;
        newY1 = client.y;
        break;
      case "tr":
        newX2 = client.x;
        newY1 = client.y;
        break;
      case "bl":
        newX1 = client.x;
        newY2 = client.y;
        break;
      case "br":
        newX2 = client.x;
        newY2 = client.y;
        break;
    }

    setSelectedElement({
      ...selectedElement,
      x1: newX1,
      y1: newY1,
      x2: newX2,
      y2: newY2,
    });
  }
}
