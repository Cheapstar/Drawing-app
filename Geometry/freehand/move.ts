import { FreehandElement, Point } from "@/types/types";

export function handleFreehandMoveAction(
  client: Point,
  selectedElement: FreehandElement,
  setSelectedElement: (ele: FreehandElement) => void
) {
  if (selectedElement.type === "freehand") {
    const { offsetX, offsetY } = selectedElement;
    const { stroke } = selectedElement;

    const newStroke = updateEachStroke(
      stroke,
      client.x,
      client.y,
      offsetX as number[],
      offsetY as number[]
    );

    setSelectedElement({
      ...selectedElement,
      stroke: newStroke as number[][],
    });
  }
}

const updateEachStroke = (
  strokes: number[][],
  clientX: number,
  clientY: number,
  offsetX: number[],
  offsetY: number[]
): number[][] | undefined => {
  if (!strokes) return undefined;

  const newStrokes = [...strokes];
  for (let i = 0; i < newStrokes.length; i++) {
    newStrokes[i][0] = clientX - offsetX[i];
    newStrokes[i][1] = clientY - offsetY[i];
  }

  return newStrokes;
};
