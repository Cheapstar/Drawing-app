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
