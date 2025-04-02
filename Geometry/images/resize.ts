import { ImageElement, Point } from "@/types/types";

export function handleImageResize(
  client: Point,
  selectedElement: ImageElement,
  setSelectedElement: (ele: ImageElement) => void
) {
  const { x1, y1, x2, y2, aspectRatio } = selectedElement;

  let newX1 = x1;
  let newY1 = y1;
  let newX2 = x2;
  let newY2 = y2;

  // Helper function to maintain aspect ratio if needed
  const maintainAspectRatio = (
    width: number,
    height: number,
    fixedCorner: "tl" | "tr" | "bl" | "br"
  ) => {
    if (!aspectRatio) return { width, height };

    // Calculate new dimensions while maintaining aspect ratio
    if (Math.abs(width) > Math.abs(height * aspectRatio)) {
      // Width is the determining factor
      height = width / aspectRatio;
    } else {
      // Height is the determining factor
      width = height * aspectRatio;
    }

    // Adjust coordinates based on which corner is fixed
    switch (fixedCorner) {
      case "tl":
        return {
          width,
          height,
          x1: newX1,
          y1: newY1,
          x2: newX1 + width,
          y2: newY1 + height,
        };
      case "tr":
        return {
          width,
          height,
          x1: newX2 - width,
          y1: newY1,
          x2: newX2,
          y2: newY1 + height,
        };
      case "bl":
        return {
          width,
          height,
          x1: newX1,
          y1: newY2 - height,
          x2: newX1 + width,
          y2: newY2,
        };
      case "br":
        return {
          width,
          height,
          x1: newX2 - width,
          y1: newY2 - height,
          x2: newX2,
          y2: newY2,
        };
    }
  };

  switch (selectedElement.selectedPosition) {
    // Corner cases
    case "tl": // Top Left
      newX1 = client.x;
      newY1 = client.y;
      if (aspectRatio) {
        const adjusted = maintainAspectRatio(
          newX2 - newX1,
          newY2 - newY1,
          "br"
        );
        newX1 = adjusted.x1 as number;
        newY1 = adjusted.y1 as number;
      }
      break;

    case "tr": // Top Right
      newX2 = client.x;
      newY1 = client.y;
      if (aspectRatio) {
        const adjusted = maintainAspectRatio(
          newX2 - newX1,
          newY2 - newY1,
          "bl"
        );
        newX2 = adjusted.x2 as number;
        newY1 = adjusted.y1 as number;
      }
      break;

    case "bl": // Bottom Left
      newX1 = client.x;
      newY2 = client.y;
      if (aspectRatio) {
        const adjusted = maintainAspectRatio(
          newX2 - newX1,
          newY2 - newY1,
          "tr"
        );
        newX1 = adjusted.x1 as number;
        newY2 = adjusted.y2 as number;
      }
      break;

    case "br": // Bottom Right
      newX2 = client.x;
      newY2 = client.y;
      if (aspectRatio) {
        const adjusted = maintainAspectRatio(
          newX2 - newX1,
          newY2 - newY1,
          "tl"
        );
        newX2 = adjusted.x2 as number;
        newY2 = adjusted.y2 as number;
      }
      break;

    // Edge cases
    case "t": // Top edge
      newY1 = client.y;
      if (aspectRatio) {
        const newHeight = newY2 - newY1;
        const newWidth = newHeight * aspectRatio;
        const deltaWidth = newWidth - (newX2 - newX1);
        // Center horizontally when resizing with aspect ratio
        newX1 -= deltaWidth / 2;
        newX2 += deltaWidth / 2;
      }
      break;

    case "b": // Bottom edge
      newY2 = client.y;
      if (aspectRatio) {
        const newHeight = newY2 - newY1;
        const newWidth = newHeight * aspectRatio;
        const deltaWidth = newWidth - (newX2 - newX1);
        // Center horizontally when resizing with aspect ratio
        newX1 -= deltaWidth / 2;
        newX2 += deltaWidth / 2;
      }
      break;

    case "l": // Left edge
      newX1 = client.x;
      if (aspectRatio) {
        const newWidth = newX2 - newX1;
        const newHeight = newWidth / aspectRatio;
        const deltaHeight = newHeight - (newY2 - newY1);
        // Center vertically when resizing with aspect ratio
        newY1 -= deltaHeight / 2;
        newY2 += deltaHeight / 2;
      }
      break;

    case "r": // Right edge
      newX2 = client.x;
      if (aspectRatio) {
        const newWidth = newX2 - newX1;
        const newHeight = newWidth / aspectRatio;
        const deltaHeight = newHeight - (newY2 - newY1);
        // Center vertically when resizing with aspect ratio
        newY1 -= deltaHeight / 2;
        newY2 += deltaHeight / 2;
      }
      break;
  }

  // Update the element with new coordinates and dimensions
  setSelectedElement({
    ...selectedElement,
    x1: newX1,
    y1: newY1,
    x2: newX2,
    y2: newY2,
    width: newX2 - newX1,
    height: newY2 - newY1,
  });
}
