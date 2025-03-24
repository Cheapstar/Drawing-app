import {
  getNewControlPoints,
  point,
  quadraticBezierMidpoint,
} from "@/Geometry/utils";
import { LineElement, Point } from "@/types/types";

export function handleLineResize(
  client: Point,
  selectedElement: LineElement,
  setSelectedElement: (ele: LineElement) => void
) {
  // console.log("Line is resizing");

  if (selectedElement?.selectedPosition === "start") {
    // Here we need to update the x1,y1

    setSelectedElement({
      ...selectedElement,
      x1: client.x,
      y1: client.y,
      controlPoint: {
        x: selectedElement.isCurved
          ? (selectedElement.controlPoint as Point).x
          : (selectedElement.x1 + selectedElement.x2) / 2,
        y: selectedElement.isCurved
          ? (selectedElement.controlPoint as Point).y
          : (selectedElement.y1 + selectedElement.y2) / 2,
      },
    });
  } else if (selectedElement?.selectedPosition === "end") {
    // Here we need to update the x1,y1
    setSelectedElement({
      ...selectedElement,
      x2: client.x,
      y2: client.y,
      controlPoint: {
        x: selectedElement.isCurved
          ? (selectedElement.controlPoint as Point).x
          : (selectedElement.x1 + selectedElement.x2) / 2,
        y: selectedElement.isCurved
          ? (selectedElement.controlPoint as Point).y
          : (selectedElement.y1 + selectedElement.y2) / 2,
      },
    });
  } else if (selectedElement.selectedPosition === "middle") {
    const newControlPoints = getNewControlPoints(
      selectedElement,
      point(client.x, client.y)
    );
    setSelectedElement({
      ...selectedElement,
      controlPoint: newControlPoints,
      isCurved: true,
    });
  } else {
    // Check which position has been selected
    // Based on that we have to scale the curve

    const { x1, y1, x2, y2, controlPoint } = selectedElement as LineElement;

    let newX1 = x1,
      newX2 = x2,
      newY1 = y1,
      newY2 = y2;
    const newControlPoints = controlPoint as Point;

    // Calculate the true bounding box of the Bezier curve
    const minX = Math.min(x1, x2, quadraticBezierMidpoint(selectedElement).x);
    const maxX = Math.max(x1, x2, quadraticBezierMidpoint(selectedElement).x);
    const minY = Math.min(y1, y2, quadraticBezierMidpoint(selectedElement).y);
    const maxY = Math.max(y1, y2, quadraticBezierMidpoint(selectedElement).y);

    // Calculate true width and height
    const trueWidth = maxX - minX;
    const trueHeight = maxY - minY;

    // Define original control point position relative to the bounding box
    const relativeControlX = ((controlPoint as Point).x - minX) / trueWidth;
    const relativeControlY = ((controlPoint as Point).y - minY) / trueHeight;

    let newMinX = minX,
      newMaxX = maxX,
      newMinY = minY,
      newMaxY = maxY;
    let flipX = false,
      flipY = false;

    switch (selectedElement.selectedPosition) {
      case "b":
        newMaxY = client.y;
        // Check for vertical flip
        if (newMaxY < newMinY) {
          [newMinY, newMaxY] = [newMaxY, newMinY];
          flipY = true;
        }
        break;
      case "t":
        newMinY = client.y;
        // Check for vertical flip
        if (newMinY > newMaxY) {
          [newMinY, newMaxY] = [newMaxY, newMinY];
          flipY = true;
        }
        break;
      case "l":
        newMinX = client.x;
        // Check for horizontal flip
        if (newMinX > newMaxX) {
          [newMinX, newMaxX] = [newMaxX, newMinX];
          flipX = true;
        }
        break;
      case "r":
        newMaxX = client.x;
        // Check for horizontal flip
        if (newMaxX < newMinX) {
          [newMinX, newMaxX] = [newMaxX, newMinX];
          flipX = true;
        }
        break;
      // Corner cases
      case "tr":
        newMinY = client.y;
        newMaxX = client.x;
        // Check for flips
        if (newMinY > newMaxY) {
          [newMinY, newMaxY] = [newMaxY, newMinY];
          flipY = true;
        }
        if (newMaxX < newMinX) {
          [newMinX, newMaxX] = [newMaxX, newMinX];
          flipX = true;
        }
        break;
      case "tl":
        newMinY = client.y;
        newMinX = client.x;
        // Check for flips
        if (newMinY > newMaxY) {
          [newMinY, newMaxY] = [newMaxY, newMinY];
          flipY = true;
        }
        if (newMinX > newMaxX) {
          [newMinX, newMaxX] = [newMaxX, newMinX];
          flipX = true;
        }
        break;
      case "br":
        newMaxY = client.y;
        newMaxX = client.x;
        // Check for flips
        if (newMaxY < newMinY) {
          [newMinY, newMaxY] = [newMaxY, newMinY];
          flipY = true;
        }
        if (newMaxX < newMinX) {
          [newMinX, newMaxX] = [newMaxX, newMinX];
          flipX = true;
        }
        break;
      case "bl":
        newMaxY = client.y;
        newMinX = client.x;
        // Check for flips
        if (newMaxY < newMinY) {
          [newMinY, newMaxY] = [newMaxY, newMinY];
          flipY = true;
        }
        if (newMinX > newMaxX) {
          [newMinX, newMaxX] = [newMaxX, newMinX];
          flipX = true;
        }
        break;
    }

    // Calculate new dimensions (ensure they're never zero to avoid division issues)
    const newTrueWidth = Math.max(newMaxX - newMinX, 0.1);
    const newTrueHeight = Math.max(newMaxY - newMinY, 0.1);

    // Update control point while maintaining its relative position, accounting for flips
    let newRelativeX = relativeControlX;
    let newRelativeY = relativeControlY;

    if (flipX) newRelativeX = 1 - relativeControlX;
    if (flipY) newRelativeY = 1 - relativeControlY;

    newControlPoints.x = newMinX + newRelativeX * newTrueWidth;
    newControlPoints.y = newMinY + newRelativeY * newTrueHeight;

    // Map original endpoints to new positions based on their relationship to the original bounds
    // For each endpoint, determine if it was at min/max X/Y originally, and map accordingly
    if (Math.abs(x1 - minX) < 0.001) {
      newX1 = flipX ? newMaxX : newMinX;
    } else if (Math.abs(x1 - maxX) < 0.001) {
      newX1 = flipX ? newMinX : newMaxX;
    } else {
      // If it wasn't at the boundary, maintain its relative position
      const relX1 = (x1 - minX) / trueWidth;
      newX1 = newMinX + (flipX ? 1 - relX1 : relX1) * newTrueWidth;
    }

    if (Math.abs(x2 - minX) < 0.001) {
      newX2 = flipX ? newMaxX : newMinX;
    } else if (Math.abs(x2 - maxX) < 0.001) {
      newX2 = flipX ? newMinX : newMaxX;
    } else {
      const relX2 = (x2 - minX) / trueWidth;
      newX2 = newMinX + (flipX ? 1 - relX2 : relX2) * newTrueWidth;
    }

    if (Math.abs(y1 - minY) < 0.001) {
      newY1 = flipY ? newMaxY : newMinY;
    } else if (Math.abs(y1 - maxY) < 0.001) {
      newY1 = flipY ? newMinY : newMaxY;
    } else {
      const relY1 = (y1 - minY) / trueHeight;
      newY1 = newMinY + (flipY ? 1 - relY1 : relY1) * newTrueHeight;
    }

    if (Math.abs(y2 - minY) < 0.001) {
      newY2 = flipY ? newMaxY : newMinY;
    } else if (Math.abs(y2 - maxY) < 0.001) {
      newY2 = flipY ? newMinY : newMaxY;
    } else {
      const relY2 = (y2 - minY) / trueHeight;
      newY2 = newMinY + (flipY ? 1 - relY2 : relY2) * newTrueHeight;
    }

    let selectedPos = selectedElement.selectedPosition;

    // Update selected position based on flips
    if (flipX && flipY) {
      // Complete diagonal flip
      switch (selectedPos) {
        case "tr":
          selectedPos = "bl";
          break;
        case "tl":
          selectedPos = "br";
          break;
        case "br":
          selectedPos = "tl";
          break;
        case "bl":
          selectedPos = "tr";
          break;
        case "t":
          selectedPos = "b";
          break;
        case "b":
          selectedPos = "t";
          break;
        case "l":
          selectedPos = "r";
          break;
        case "r":
          selectedPos = "l";
          break;
      }
    } else if (flipX) {
      // Horizontal flip only
      switch (selectedPos) {
        case "tr":
          selectedPos = "tl";
          break;
        case "tl":
          selectedPos = "tr";
          break;
        case "br":
          selectedPos = "bl";
          break;
        case "bl":
          selectedPos = "br";
          break;
        case "l":
          selectedPos = "r";
          break;
        case "r":
          selectedPos = "l";
          break;
      }
    } else if (flipY) {
      // Vertical flip only
      switch (selectedPos) {
        case "tr":
          selectedPos = "br";
          break;
        case "tl":
          selectedPos = "bl";
          break;
        case "br":
          selectedPos = "tr";
          break;
        case "bl":
          selectedPos = "tl";
          break;
        case "t":
          selectedPos = "b";
          break;
        case "b":
          selectedPos = "t";
          break;
      }
    }

    setSelectedElement({
      ...selectedElement,
      controlPoint: newControlPoints as Point,
      x1: newX1,
      x2: newX2 as number,
      y1: newY1,
      y2: newY2 as number,
      selectedPosition: selectedPos,
    } as LineElement);
  }
}
