import { FreehandElement, Point } from "@/types/types";
import { Element } from "@/types/types";
export function getTheOffsets(elementAtPosition: Element, client: Point) {
  const offsetX = [];
  const offsetY = [];

  switch (elementAtPosition.type) {
    case "rectangle":
    case "line":
    case "text":
      console.log("Setting up the offsets");
      offsetX.push(client.x - (elementAtPosition.x1 as number));
      offsetY.push(client.y - (elementAtPosition.y1 as number));
      break;
    case "freehand":
      const freehandElement = elementAtPosition as FreehandElement;
      for (let i = 0; i < freehandElement.stroke.length; i++) {
        offsetX.push(client.x - freehandElement.stroke[i][0]);
        offsetY.push(client.y - freehandElement.stroke[i][1]);
      }
      break;
  }

  return {
    x: offsetX,
    y: offsetY,
  };
}

export function expandCanvasOnDrag(
  event: React.PointerEvent<HTMLCanvasElement>, // Event to track pointer position
  boardRef: React.RefObject<HTMLCanvasElement>,
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>,
  threshold: number = 5, // How close to the edge before expanding
  expandBy: number = 10 // How much to translate when near an edge
) {
  if (!boardRef.current) return;

  const canvas = boardRef.current;
  const { clientWidth: width, clientHeight: height } = canvas;
  const { clientX, clientY } = event;

  let deltaX = 0;
  let deltaY = 0;

  console.log(width, clientX);

  // Detect if cursor is near the edges
  if (clientX <= threshold) deltaX = -expandBy; // Left edge
  if (clientX >= width - threshold) deltaX = expandBy; // Right edge
  if (clientY <= threshold) deltaY = -expandBy; // Top edge
  if (clientY >= height - threshold) deltaY = expandBy; // Bottom edge

  // Apply translation offset
  setPanOffset((prev) => ({
    x: prev.x - deltaX,
    y: prev.y - deltaY,
  }));
}

/*
  We Can Run This Function At Regular Interval
*/
