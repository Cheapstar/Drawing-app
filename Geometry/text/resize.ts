import { Point, TextElement } from "@/types/types";

export function handleTextResize(
  client: Point,
  selectedElement: TextElement,
  setSelectedElement: (ele: TextElement) => void
) {
  if (!selectedElement) return;

  console.log("resizing text", selectedElement);

  const { x1, y1, height, width, selectedPosition, fontSize } = selectedElement;

  let newX1 = x1,
    newX2 = x1 + width,
    newY1 = y1,
    newY2 = y1 + height,
    newFontSize = fontSize;

  // Original width and height used for font scaling reference
  const originalWidth = width;
  const originalHeight = height;

  switch (selectedPosition) {
    // Sides
    case "r":
      newX2 = client.x;
      break;
    case "l":
      newX1 = client.x;
      break;
    case "t":
      newY1 = client.y;
      break;
    case "b":
      newY2 = client.y;
      break;

    // Corners
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

  // Calculate new dimensions
  const newWidth = Math.max(1, newX2 - newX1);
  const newHeight = Math.max(1, newY2 - newY1);

  // Apply font scaling for corner, top and bottom resize cases
  if (["tl", "tr", "bl", "br", "t", "b"].includes(selectedPosition as string)) {
    let scaleFactor;

    // For corners, use primarily width changes
    if (["tl", "tr", "bl", "br"].includes(selectedPosition as string)) {
      scaleFactor = newWidth / originalWidth;
    }
    // For top and bottom edges, use a dampened height scaling to prevent jumps
    else if (["t", "b"].includes(selectedPosition as string)) {
      // Use a more conservative scaling factor for height to prevent jumping
      const heightChange = newHeight / originalHeight;
      // Dampen the scaling to make it more gradual
      scaleFactor = 1 + (heightChange - 1) * 0.5;
    }

    // Apply scaling with minimum size protection
    newFontSize = Math.max(
      8, // Minimum font size
      Math.round((fontSize as number) * (scaleFactor as number))
    );
  }

  setSelectedElement({
    ...selectedElement,
    x1: newX1,
    y1: newY1,
    x2: newX2,
    y2: newY2,
    width: newWidth,
    height: newHeight,
    fontSize: newFontSize,
  });
}
