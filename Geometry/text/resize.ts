import { Point, TextElement } from "@/types/types";

export function handleTextResize(
  client: Point,
  selectedElement: TextElement,
  setSelectedElement: (ele: TextElement) => void
) {
  if (!selectedElement) return;

  const { x1, y1, height, width, selectedPosition, fontSize } = selectedElement;

  let newX1 = x1,
    newX2 = x1 + width,
    newY1 = y1,
    newY2 = y1 + height,
    newFontSize = fontSize;

  // Store original dimensions for scaling reference
  const originalWidth = width;
  const originalHeight = height;

  // Resize logic with improved coordinate handling
  switch (selectedPosition) {
    // Sides
    case "r":
      newX2 = Math.max(newX1 + 1, client.x);
      break;
    case "l":
      newX1 = Math.min(newX2 - 1, client.x);
      break;
    case "t":
      newY1 = Math.min(newY2 - 1, client.y);
      break;
    case "b":
      newY2 = Math.max(newY1 + 1, client.y);
      break;

    // Corners
    case "tl":
      newX1 = Math.min(newX2 - 1, client.x);
      newY1 = Math.min(newY2 - 1, client.y);
      break;
    case "tr":
      newX2 = Math.max(newX1 + 1, client.x);
      newY1 = Math.min(newY2 - 1, client.y);
      break;
    case "bl":
      newX1 = Math.min(newX2 - 1, client.x);
      newY2 = Math.max(newY1 + 1, client.y);
      break;
    case "br":
      newX2 = Math.max(newX1 + 1, client.x);
      newY2 = Math.max(newY1 + 1, client.y);
      break;
  }

  // Calculate new dimensions
  const newWidth = Math.max(10, newX2 - newX1);
  const newHeight = Math.max(10, newY2 - newY1);

  // Advanced font scaling logic
  const scalingPositions = ["tl", "tr", "bl", "br", "t", "b"];
  if (scalingPositions.includes(selectedPosition as string)) {
    // Calculate scale factors
    const widthScaleFactor = newWidth / originalWidth;
    const heightScaleFactor = newHeight / originalHeight;

    // Smooth scaling algorithm
    const smoothScaleFactor = (() => {
      switch (selectedPosition) {
        case "tl":
        case "tr":
        case "bl":
        case "br":
          // For corners, use a blend of width and height
          return (widthScaleFactor + heightScaleFactor) / 2;
        case "t":
        case "b":
          // For top/bottom, prioritize height with less intensity
          return 1 + (heightScaleFactor - 1) * 0.7;
        default:
          return 1;
      }
    })();

    // Calculate new font size with smooth scaling
    newFontSize = Math.max(
      8, // Minimum font size
      Math.max(
        8, // Absolute minimum
        Math.round((fontSize as number) * smoothScaleFactor)
      )
    );
  }

  // Prepare updated element
  const updatedElement = {
    ...selectedElement,
    x1: newX1,
    y1: newY1,
    x2: newX2,
    y2: newY2,
    width: newWidth,
    height: newHeight,
    fontSize: newFontSize,
  };

  setSelectedElement(updatedElement);
}
