import { nearPoint } from "@/components/utils/position";
import { FreehandElement, Point } from "@/types/types";

export const checkOnFreehand = (client: Point, element: FreehandElement) => {
  if (!element.stroke || element.stroke.length < 1) return null;

  for (let i = 0; i < element.stroke.length; i++) {
    const res = nearPoint(
      client.x,
      client.y,
      element.stroke[i][0],
      element.stroke[i][1],
      element.strokeWidth as number
    );
    console.log("Checking on Freehand Ele", res);
    if (res) {
      return res;
    }
  }
  return null;
};
