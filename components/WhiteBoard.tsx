"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import { ToolBar } from "./ToolBar";
import { UndoRedo } from "./UndoRedo";
import getStroke from "perfect-freehand";
import { RoughCanvas } from "roughjs/bin/canvas";
import { ZoomButtons } from "./ZoomButtons";
import { colorAtom, strokeWidthAtom } from "@/store/store";
import { useAtom } from "jotai";
import { ColorPicker } from "./ColorPicker";
import { Menu } from "./Menu";

// Define types first to avoid forward reference issues
export type TOOL =
  | "rectangle"
  | "line"
  | "move"
  | "select"
  | "pencil"
  | "text"
  | "pan";
export type Action =
  | "drawing"
  | "selecting"
  | "moving"
  | "resizing"
  | "writing"
  | "panning"
  | "none";
export type Shapes = "rectangle" | "line" | "pencil" | "text";
export type SelectedPosition =
  | "inside"
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "start"
  | "end"
  | "b"
  | "t"
  | "l"
  | "r"
  | null;
export type Point = {
  x: number;
  y: number;
};

export type Element = {
  type: Shapes;
  id: string;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  text?: string;
  stroke?: number[][];
  offsetX?: number[];
  offsetY?: number[];
  selectedPosition?: SelectedPosition;
  path?: Path2D;
  drawnShape?: Drawable;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  strokeWidth?: number;
};

const generator = rough.generator();

const DEFAULT_STROKE_OPTIONS = {
  size: 16,
  smoothing: 0.5,
  thinning: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  start: {
    taper: 0,
    cap: true,
  },
  end: {
    taper: 0,
    cap: true,
  },
};

const createRectangle = (
  x1: number,
  y1: number,
  width: number,
  height: number,
  color: string,
  strokeWidth: number
) => {
  const roughElement = generator.rectangle(x1, y1, width, height, {
    stroke: color,
    strokeWidth: strokeWidth / 8,
  });
  return { x1, y1, x2: x1 + width, y2: y1 + height, drawnShape: roughElement };
};

const createLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  strokeWidth: number
) => {
  const roughElement = generator.line(x1, y1, x2, y2, {
    stroke: color,
    strokeWidth: strokeWidth / 8,
  });
  return { x1, y1, x2, y2, drawnShape: roughElement };
};

const getElementAtPosition = (
  clientX: number,
  clientY: number,
  elements: Element[]
): Partial<Element> & { selectedPosition: SelectedPosition } => {
  let position: SelectedPosition = null;

  const foundElement = elements.find(({ type, x1, y1, x2, y2, stroke }) => {
    position = positionWithinShape(
      clientX,
      clientY,
      x1,
      y1,
      x2,
      y2,
      type,
      stroke
    );
    return position !== null;
  });

  return {
    ...(foundElement || {}),
    selectedPosition: position,
  };
};

const positionWithinShape = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: Shapes,
  stroke?: number[][]
): SelectedPosition => {
  switch (type) {
    case "rectangle":
      return positionOnRectangle(clientX, clientY, x1, y1, x2, y2);
    case "line":
      return positionOnLine(
        point(clientX, clientY),
        point(x1, y1),
        point(x2, y2)
      );
    case "pencil":
      return positionOnPencil(point(clientX, clientY), stroke as number[][]);
    case "text":
      return clientX >= x1 && clientY >= y1 && clientX <= x2 && clientY <= y2
        ? "inside"
        : null;
    default:
      return null;
  }
};

const nearPoint = (x1: number, y1: number, x2: number, y2: number): boolean => {
  return Math.abs(x2 - x1) < 10 && Math.abs(y2 - y1) < 10;
};

const point = (x: number, y: number): Point => ({ x, y });

const positionOnPencil = (client: Point, stroke: number[][]) => {
  console.log("Checking Pencil");
  console.log("Position Stroke", stroke);
  if (!stroke) return null;
  let a = stroke[0];

  for (let i = 1; i < stroke.length; i++) {
    const b = stroke[i];
    const res = positionOnLine(client, point(a[0], a[1]), point(b[0], b[1]));
    if (res) {
      return res;
    }

    a = b;
  }
  return null;
};

const positionOnRectangle = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): SelectedPosition => {
  const topLeft = nearPoint(clientX, clientY, x1, y1) ? "tl" : null;
  const topRight = nearPoint(clientX, clientY, x2, y1) ? "tr" : null;
  const bottomLeft = nearPoint(clientX, clientY, x1, y2) ? "bl" : null;
  const bottomRight = nearPoint(clientX, clientY, x2, y2) ? "br" : null;

  const top = positionOnLine(
    point(clientX, clientY),
    point(x1, y1),
    point(x2, y1)
  )
    ? "t"
    : null;
  const right = positionOnLine(
    point(clientX, clientY),
    point(x2, y1),
    point(x2, y2)
  )
    ? "r"
    : null;
  const bottom = positionOnLine(
    point(clientX, clientY),
    point(x1, y2),
    point(x2, y2)
  )
    ? "b"
    : null;
  const left = positionOnLine(
    point(clientX, clientY),
    point(x1, y1),
    point(x1, y2)
  )
    ? "l"
    : null;

  const inside =
    clientX >= x1 && clientY >= y1 && clientX <= x2 && clientY <= y2
      ? "inside"
      : null;

  return (
    topLeft ||
    topRight ||
    bottomLeft ||
    bottomRight ||
    top ||
    right ||
    bottom ||
    left ||
    inside
  );
};

const positionOnLine = (
  clientPoint: Point,
  a: Point,
  b: Point
): SelectedPosition => {
  const offset =
    distance(a, b) - distance(a, clientPoint) - distance(b, clientPoint);
  const inside = Math.abs(offset) < 1 ? "inside" : null;

  const start = nearPoint(clientPoint.x, clientPoint.y, a.x, a.y)
    ? "start"
    : null;
  const end = nearPoint(clientPoint.x, clientPoint.y, b.x, b.y) ? "end" : null;
  return inside || start || end;
};

const distance = (a: Point, b: Point): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const createFreeHand = (points: number[][], strokeWidth: number) => {
  const path = new Path2D();
  const outline = getStroke(points, {
    ...DEFAULT_STROKE_OPTIONS,
    size: strokeWidth,
  });

  if (outline.length < 2)
    return {
      path,
      x1: outline[0][0],
      y1: outline[0][1],
      x2: outline[0][0],
      y2: outline[0][1],
    };

  path.moveTo(outline[0][0], outline[0][1]);

  let minX = outline[0][0];
  let maxX = outline[0][0];
  let minY = outline[0][1];
  let maxY = outline[0][1];

  // Draw smooth curves through points
  for (let i = 1; i < outline.length - 1; i++) {
    const xc = (outline[i][0] + outline[i + 1][0]) / 2;
    const yc = (outline[i][1] + outline[i + 1][1]) / 2;
    path.quadraticCurveTo(outline[i][0], outline[i][1], xc, yc);

    // updating the min's and max's
    minX = Math.min(outline[i][0], minX);
    maxX = Math.max(outline[i][0], maxX);
    minY = Math.min(outline[i][1], minY);
    maxY = Math.max(outline[i][1], maxY);
  }

  path.closePath();
  return { path, x1: minX, y1: minY, x2: maxX, y2: maxY };
};

const createElement = ({
  type,
  x1,
  y1,
  x2,
  y2,
  color,
  stroke,
  text,
  strokeWidth,
}: Partial<Element>): Element => {
  console.log("Color", color);
  switch (type) {
    case "rectangle":
      return {
        ...createRectangle(x1, y1, x2 - x1, y2 - y1, color, strokeWidth),
        type,
        id: crypto.randomUUID(),
        color,
        strokeWidth,
      };
    case "line":
      console.log("line Updating");

      return {
        ...createLine(x1, y1, x2, y2, color, strokeWidth),
        type,
        id: crypto.randomUUID(),
        color,
        strokeWidth,
      };
    case "pencil":
      console.log("Here is the stroke", stroke);
      return {
        ...createFreeHand(stroke as number[][], strokeWidth as number),
        stroke,
        type,
        id: crypto.randomUUID(),
        color,
        strokeWidth,
      };
    case "text":
      return { x1, y1, x2, y2, text, type, id: crypto.randomUUID(), color };
    default:
      throw new Error(`Unsupported shape type: ${type}`);
  }
};

const adjustElementCoordinates = (
  type: Shapes,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { newX1: number; newY1: number; newX2: number; newY2: number } => {
  if (type === "rectangle") {
    const MinX = Math.min(x1, x2);
    const MaxX = Math.max(x1, x2);
    const MinY = Math.min(y1, y2);
    const MaxY = Math.max(y1, y2);

    return {
      newX1: MinX,
      newY1: MinY,
      newX2: MaxX,
      newY2: MaxY,
    };
  } else {
    if (x1 < x2 || (x2 === x1 && y1 < y2)) {
      return {
        newX1: x1,
        newY1: y1,
        newX2: x2,
        newY2: y2,
      };
    } else {
      return {
        newX1: x2,
        newY1: y2,
        newX2: x1,
        newY2: y1,
      };
    }
  }
};

type HistoryState = Element[];
type SetHistoryState = (
  action: ((prevState: HistoryState) => HistoryState) | HistoryState,
  overWrite?: boolean
) => void;

const useHistory = (
  initialState: HistoryState = []
): [HistoryState, SetHistoryState, () => void, () => void] => {
  const [index, setIndex] = useState<number>(0);
  const [history, setHistory] = useState<HistoryState[]>([initialState]);

  const setState: SetHistoryState = (action, overWrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;

    if (overWrite) {
      const newHistory = [...history];
      newHistory[index] = newState;
      setHistory(newHistory);
    } else {
      const newHistory = [...history].slice(0, index + 1);
      setHistory([...newHistory, newState]);
      setIndex((prevState) => prevState + 1);
    }
  };

  const undo = () => index > 0 && setIndex((prevState) => prevState - 1);
  const redo = () =>
    index < history.length - 1 && setIndex((prevState) => prevState + 1);

  return [history[index] || [], setState, undo, redo];
};

const drawElement = (
  roughCanvas: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  element: Element
) => {
  switch (element.type) {
    case "line":
    case "rectangle":
      roughCanvas.draw(element.drawnShape as Drawable);
      break;
    case "pencil":
      ctx.save();
      ctx.fillStyle = element.color;
      ctx.fill(element.path as Path2D);
      ctx.restore();
      break;
    case "text":
      ctx.save();
      ctx.textBaseline = "top";
      ctx.fillStyle = element.color;
      ctx.fillText(element.text as string, element.x1, element.y1 as number);
      ctx.restore();
      break;
  }
};

const usePressedKeys = () => {
  const [pressedKeys, setPressedKeys] = useState(new Set());

  useEffect(() => {
    const handleKeyDown = (event: { key: unknown }) => {
      setPressedKeys((prevKeys) => new Set(prevKeys).add(event.key));
    };

    const handleKeyUp = (event: { key: unknown }) => {
      setPressedKeys((prevKeys) => {
        const updatedKeys = new Set(prevKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return pressedKeys;
};

// for moving
const updateEachStroke = (
  strokes: number[][],
  clientX: number,
  clientY: number,
  offsetX: number[],
  offsetY: number[]
) => {
  if (!strokes) return undefined;

  const newStrokes = [...strokes];
  for (let i = 0; i < newStrokes.length; i++) {
    newStrokes[i][0] = clientX - offsetX[i];
    newStrokes[i][1] = clientY - offsetY[i];
  }

  return newStrokes;
};

export function WhiteBoard() {
  const [elements, setElements, undo, redo] = useHistory([]);

  const boardRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<TOOL>("select");

  const [action, setAction] = useState<Action>("none");

  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [panOffset, setPanOffSet] = useState<Point>(point(0, 0));
  const [startPanMousePosition, setStartPanMousePosition] =
    React.useState<Point>({ x: 0, y: 0 });

  const [scale, setScale] = useState<number>(1);
  const [scaleOffset, setScaleOffset] = useState<Point>({ x: 0, y: 0 });
  const pressedKeys = usePressedKeys();

  const textElementRef = useRef<HTMLTextAreaElement>(null);

  const [color] = useAtom(colorAtom);
  const [strokeWidth, setStrokeWidth] = useAtom(strokeWidthAtom);

  useEffect(() => {
    if (action === "writing" && textElementRef.current) {
      // Small timeout to ensure the DOM has updated
      setTimeout(() => {
        if (textElementRef.current) {
          textElementRef.current.focus();
        }
      }, 0);
    }
  }, [action, textElementRef]);

  const resizeCanvas = useCallback(() => {
    if (!boardRef.current) return;

    boardRef.current.width = window.innerWidth;
    boardRef.current.height = window.innerHeight;
    boardRef.current.style.width = window.innerWidth + "px";
    boardRef.current.style.height = window.innerHeight + "px";
  }, []);

  useEffect(() => {
    const panOrZoomFunction = (event: { deltaX: number; deltaY: number }) => {
      if (pressedKeys.has("Meta") || pressedKeys.has("control")) {
        onZoom(event.deltaY * -0.01);
      } else {
        setPanOffSet((prevState) => ({
          x: prevState.x - event.deltaX,
          y: prevState.y - event.deltaY,
        }));
      }
    };

    document.addEventListener("wheel", panOrZoomFunction);
    return () => {
      document.removeEventListener("wheel", panOrZoomFunction);
    };
  }, [tool]);

  const selectTool = (tool: TOOL) => {
    setTool(tool);
  };

  useLayoutEffect(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rc = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;

    const scaleOffsetX = (scaledWidth - canvas.width) / scale;
    const scaleOffsetY = (scaledHeight - canvas.height) / scale;

    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });

    ctx.save();

    ctx.translate(
      panOffset.x * scale - scaleOffsetX,
      panOffset.y * scale - scaleOffsetY
    );
    ctx.scale(scale, scale);
    elements.forEach((element: Element) => {
      drawElement(rc, ctx, element);
    });

    if (selectedElement) {
      const x1 = Math.min(selectedElement.x1, selectedElement.x2) - 5;
      const y1 = Math.min(selectedElement.y1, selectedElement.y2) - 5;
      const width = Math.abs(selectedElement.x2 - selectedElement.x1) + 10;
      const height = Math.abs(selectedElement.y2 - selectedElement.y1) + 10;

      const container = generator.rectangle(x1, y1, width, height, {
        strokeLineDash: [5, 10],
        stroke: "rgba(48, 183, 248, 0.8)",
        strokeWidth: 1.2,
      });

      rc.draw(container);
    }

    ctx.restore();
  }, [elements, selectedElement, panOffset, scale]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const updateElement = (
    index: number,
    {
      id,

      x1,
      y1,
      x2,
      y2,
      type,
      text,
      stroke,
      color,
      strokeWidth,
    }: Partial<Element>
  ) => {
    const updatedElement = createElement({
      x1,
      y1,
      x2,
      y2,
      type,
      text: text || "",
      stroke,
      color,
      strokeWidth,
    });

    const newElements = [...elements];
    newElements[index] = { ...updatedElement, id };

    setElements(newElements, true);

    return updatedElement;
  };

  const getMouseCoordinates = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const x = (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
    const y = (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;

    return { x, y };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    if (action === "writing") {
      return;
    }

    if (tool === "pan") {
      setStartPanMousePosition({ x: clientX, y: clientY });

      setAction("panning");
      return;
    }

    if (tool === "select") {
      const element = getElementAtPosition(clientX, clientY, elements);

      console.log("Element", element);
      if (element.selectedPosition) {
        if (!element.x1 || !element.y1) return; // Safety check

        const offsetX = [];
        const offsetY = [];

        if (element.type === "pencil" && element.stroke) {
          for (let i = 0; i < element.stroke.length; i++) {
            offsetX.push(clientX - element.stroke[i][0]);
            offsetY.push(clientY - element.stroke[i][1]);
          }
        } else {
          offsetX.push(clientX - element.x1);
          offsetY.push(clientY - element.y1);
        }

        const fullElement = elements.find((el) => el.id === element.id);
        if (!fullElement) return;

        setSelectedElement({
          ...fullElement,
          offsetX,
          offsetY,
          selectedPosition: element.selectedPosition,
        });
        console.log("SelectedElement in PointerDown", {
          ...fullElement,
          offsetX,
          offsetY,
          selectedPosition: element.selectedPosition,
        });
        console.log("OffsetX", offsetX);
        console.log("offsetY", offsetY);

        if (element.selectedPosition === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      } else if (selectedElement) {
        console.log("Highlighted Zone");
        // check if it is in the highlighted zone
        const isInside = positionOnRectangle(
          clientX,
          clientY,
          selectedElement.x1 - 5,
          selectedElement.y1 - 5,
          selectedElement.x2 + 10,
          selectedElement.y2 + 10
        );

        if (!isInside) {
          setSelectedElement(null);
          setAction("selecting");
        } else if (isInside === "inside") {
          console.log("Inside the Highlighted Zone", isInside);

          const offsetX = [];
          const offsetY = [];

          console.log("Element inside Highlighted Zone", selectedElement);

          if (selectedElement.type === "pencil" && selectedElement.stroke) {
            for (let i = 0; i < selectedElement.stroke.length; i++) {
              console.log("Updaing the offest");
              offsetX.push(clientX - selectedElement.stroke[i][0]);
              offsetY.push(clientY - selectedElement.stroke[i][1]);
            }
          } else {
            offsetX.push(clientX - (selectedElement.x1 as number));
            offsetY.push(clientY - (selectedElement.y1 as number));
          }
          console.log("OffsetX", offsetX);
          console.log("offsetY", offsetY);

          setSelectedElement({
            ...selectedElement,
            offsetX,
            offsetY,
            selectedPosition: isInside,
          });

          setElements((prevState) => prevState);

          setAction("moving");
        } else {
          console.log("resizing", isInside);
          setElements((prevState) => prevState);
          setSelectedElement({
            ...selectedElement,
            selectedPosition: isInside,
          });
          setAction("resizing");
        }
      }
    } else if (tool === "text") {
      console.log("text");
      setAction("writing");

      const newElement: Element = {
        type: "text",
        id: crypto.randomUUID(),
        x1: clientX,
        y1: clientY,
        text: "",
      };

      setSelectedElement(newElement);
      console.log("Rendering the text");
    } else {
      setAction("drawing");
      setSelectedElement(null);

      if (tool === "rectangle" || tool === "line") {
        const newElement = createElement({
          x1: clientX,
          y1: clientY,
          x2: clientX,
          y2: clientY,
          type: tool,
          color,
          strokeWidth,
        });

        setElements([...elements, newElement]);
      } else if (tool === "pencil") {
        const newElement = createElement({
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          type: "pencil",
          stroke: [[clientX, clientY, event.pressure]],
          color,
          strokeWidth,
        });
        setElements([...elements, newElement]);
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);
    if (action === "moving" && selectedElement) {
      // move element at clientX , clientY
      console.log("SelectedElement in PointerMove", selectedElement);

      const index = elements.findIndex((element) => {
        return selectedElement.id === element.id;
      });

      if (index === -1) return;

      const {
        x1,
        y1,
        x2,
        y2,
        offsetX,
        offsetY,
        type,
        id,
        stroke,
        color: currentColor,
        strokeWidth: SelectedStrokeWidth,
      } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;

      // new positions and size

      if (selectedElement.type === "pencil") {
        const newStrokes = stroke
          ? updateEachStroke(
              stroke,
              clientX,
              clientY,
              offsetX as number[],
              offsetY as number[]
            )
          : undefined;

        const updatedElement = updateElement(index, {
          id,

          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          type: "pencil",
          text: "",
          stroke: newStrokes,
          color: currentColor,
          strokeWidth: SelectedStrokeWidth,
        });

        setSelectedElement({
          ...selectedElement,
          x1: updatedElement.x1,
          y1: updatedElement.y1,
          x2: updatedElement.x2,
          y2: updatedElement.y2,
          stroke: [...(newStrokes as number[][])],
        });
      } else if (selectedElement.type === "text") {
        const newX1 = clientX - ((offsetX as number[])[0] ?? 0);
        const newY1 = clientY - ((offsetY as number[])[0] ?? 0);
        const newX2 = newX1 + width;
        const newY2 = newY1 + height;
        updateElement(index, {
          id,

          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
          type,
          text: selectedElement.text,
          color: currentColor,
        });
        const updatedElement = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        };
        setSelectedElement(updatedElement);
      } else {
        const newX1 = clientX - ((offsetX as number[])[0] ?? 0);
        const newY1 = clientY - ((offsetY as number[])[0] ?? 0);
        const newX2 = newX1 + width;
        const newY2 = newY1 + height;

        updateElement(index, {
          id,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
          type,
          color: currentColor,
          strokeWidth: SelectedStrokeWidth,
        });

        const updatedElement = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        };
        setSelectedElement(updatedElement);
      }
    }

    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      if (lastIndex < 0) return;

      if (tool == "pencil") {
        const {
          x1,
          y1,
          id,
          type,
          stroke,
          color: currentColor,
          strokeWidth: SelectedStrokeWidth,
        } = elements[lastIndex];
        const newStroke = [
          ...(stroke as number[][]),
          [clientX, clientY, event.pressure],
        ];
        updateElement(lastIndex, {
          id,
          x1,
          y1,
          x2: clientX,
          y2: clientY,
          type,
          text: "",
          stroke: newStroke,
          color: currentColor,
          strokeWidth: SelectedStrokeWidth,
        });
      } else if (tool === "rectangle" || tool === "line") {
        const {
          x1,
          y1,
          id,
          type,
          color: currentColor,
          strokeWidth: SelectedStrokeWidth,
        } = elements[lastIndex];
        updateElement(lastIndex, {
          id,
          x1,
          y1,
          x2: clientX,
          y2: clientY,
          type,
          color: currentColor,
          strokeWidth: SelectedStrokeWidth,
        });
      }
    }

    if (action === "resizing" && selectedElement) {
      console.log("Resizing", selectedElement);
      const {
        id,
        x1,
        y1,
        x2,
        y2,
        type,
        selectedPosition,
        color: currentColor,
        strokeWidth: SelectedStrokeWidth,
      } = selectedElement;

      if (!selectedPosition) return;

      const index = elements.findIndex(
        (element) => selectedElement.id === element.id
      );

      if (index === -1) return;

      console.log("Selected position", selectedPosition);

      switch (selectedPosition) {
        case "b":
          updateElement(index, {
            id,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: clientY,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({ ...selectedElement, y2: clientY });
          break;

        case "t":
          updateElement(index, {
            id,
            x1: x1,
            y1: clientY,
            x2: x2,
            y2: y2,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({ ...selectedElement, y1: clientY });
          break;

        case "l":
          updateElement(index, {
            id,
            x1: clientX,
            y1: y1,
            x2: x2,
            y2: y2,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({ ...selectedElement, x1: clientX });
          break;

        case "r":
          updateElement(index, {
            id,
            x1: x1,
            y1: y1,
            x2: clientX,
            y2: y2,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({ ...selectedElement, x2: clientX });
          break;

        case "start":
        case "tl":
          updateElement(index, {
            id,
            x1: clientX,
            y1: clientY,
            x2: x2,
            y2: y2,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({
            ...selectedElement,
            x1: clientX,
            y1: clientY,
          });
          break;

        case "tr":
          updateElement(index, {
            id,
            x1: x1,
            y1: clientY,
            x2: clientX,
            y2: y2,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({
            ...selectedElement,
            x2: clientX,
            y1: clientY,
          });
          break;

        case "bl":
          updateElement(index, {
            id,
            x1: clientX,
            y1: y1,
            x2: x2,
            y2: clientY,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({
            ...selectedElement,
            x1: clientX,
            y2: clientY,
          });
          break;

        case "end":
        case "br":
          updateElement(index, {
            id,
            x1: x1,
            y1: y1,
            x2: clientX,
            y2: clientY,
            type,
            color: currentColor,
            strokeWidth: SelectedStrokeWidth,
          });
          setSelectedElement({
            ...selectedElement,
            x2: clientX,
            y2: clientY,
          });
          break;
      }

      const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
        type,
        x1,
        y1,
        x2,
        y2
      );

      updateElement(index, {
        id,
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
        type,
        color: currentColor,
        strokeWidth: SelectedStrokeWidth,
      });
    }

    if (action === "panning") {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;
      setPanOffSet((prevState) => ({
        x: prevState.x + deltaX,
        y: panOffset.y + deltaY,
      }));
      return;
    }
  };

  const handlePointerUp = () => {
    console.log("Action is ", action);
    if (action === "writing") {
      console.log("Now it should focus");
      return;
    }

    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      if (lastIndex < 0) return;

      if (tool === "pencil") {
      } else {
        const {
          x1,
          y1,
          x2,
          y2,
          type,
          id,
          color: currentColor,
        } = elements[lastIndex];
        const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
          type,
          x1,
          y1,
          x2,
          y2
        );

        updateElement(lastIndex, {
          id,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
          type,
          color: currentColor,
          strokeWidth,
        });
      }
    }
    setAction("none");
  };

  const handleBlur = () => {
    const ctx = boardRef.current?.getContext("2d");
    const text = ctx?.measureText(textElementRef.current?.value as string);
    const height = 24;
    const updatedSelectedElement = {
      ...selectedElement,
      text: textElementRef.current?.value,
      x2: selectedElement.x1 + text?.width,
      y2: selectedElement.y1 + height,
    };

    setElements([...elements, updatedSelectedElement]);
    setSelectedElement(null);
    setTool("select");
    setAction("selecting");
  };

  const onZoom = (delta: number) => {
    setScale((prevState) => Math.min(Math.max(prevState + delta, 0.1), 2));
  };

  return (
    <div onPointerUp={handlePointerUp}>
      <div className="fixed top-2 left-6">
        <ToolBar selectTool={selectTool}></ToolBar>
      </div>
      <div className="fixed bottom-2 left-6">
        <UndoRedo
          undo={undo}
          redo={redo}
        ></UndoRedo>
      </div>
      <div className="fixed bottom-2 right-6">
        <ZoomButtons
          scale={scale}
          onZoom={onZoom}
        ></ZoomButtons>
      </div>
      <div className="fixed top-28 left-5 p-4 rounded-md shadow-lg bg-white">
        <Menu></Menu>
      </div>

      {action === "writing" && (
        <textarea
          onBlur={handleBlur}
          ref={textElementRef}
          className="fixed focus:outline-none resize-none"
          style={{
            top: selectedElement?.y1 + panOffset.y,
            left: selectedElement?.x1 + panOffset.x,
          }}
          onFocus={() => console.log("Textarea focused")}
        ></textarea>
      )}
      <canvas
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="bg-white"
      ></canvas>
    </div>
  );
}

/*
"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import { ToolBar } from "./ToolBar";
import { UndoRedo } from "./UndoRedo";
import getStroke from "perfect-freehand";
import { RoughCanvas } from "roughjs/bin/canvas";
import { ZoomButtons } from "./ZoomButtons";
import { atom, useAtom } from "jotai";
import { ColorPicker } from "./ColorPicker";
import { TextOptions } from "./TextOptions";

// Define types first to avoid forward reference issues
export type TOOL =
  | "rectangle"
  | "line"
  | "move"
  | "select"
  | "pencil"
  | "text"
  | "pan";
export type Action =
  | "drawing"
  | "selecting"
  | "moving"
  | "resizing"
  | "writing"
  | "panning"
  | "none";
export type Shapes = "rectangle" | "line" | "pencil" | "text";
export type SelectedPosition =
  | "inside"
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "start"
  | "end"
  | "b"
  | "t"
  | "l"
  | "r"
  | null;
export type Point = {
  x: number;
  y: number;
};

export type Element = {
  type: Shapes;
  id: string;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  text?: string;
  stroke?: number[][];
  offsetX?: number[];
  offsetY?: number[];
  selectedPosition?: SelectedPosition;
  path?: Path2D;
  drawnShape?: Drawable;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  strokeWidth?: number;
};

// Define Jotai atoms for state management
const toolAtom = atom<TOOL>("select");
const colorAtom = atom<string>("#000000");
const strokeWidthAtom = atom<number>(1);
const fontSizeAtom = atom<number>(16);
const fontFamilyAtom = atom<string>("Arial");
const fontColorAtom = atom<string>("#000000");
const elementsAtom = atom<Element[]>([]);
const selectedElementAtom = atom<Element | null>(null);
const historyIndexAtom = atom<number>(0);
const historyAtom = atom<Element[][]>([[]]);

const generator = rough.generator();

const DEFAULT_STROKE_OPTIONS = {
  size: 16,
  smoothing: 0.5,
  thinning: 0.5,
  streamline: 0.7, // Increased for smoother feel
  easing: (t: number) => t,
  start: {
    taper: 0,
    cap: true,
  },
  end: {
    taper: 0,
    cap: true,
  },
};

const createRectangle = (
  x1: number,
  y1: number,
  width: number,
  height: number,
  color: string,
  strokeWidth: number
) => {
  const roughElement = generator.rectangle(x1, y1, width, height, {
    stroke: color,
    strokeWidth: strokeWidth,
  });
  return { x1, y1, x2: x1 + width, y2: y1 + height, drawnShape: roughElement };
};

const createLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  strokeWidth: number
) => {
  const roughElement = generator.line(x1, y1, x2, y2, {
    stroke: color,
    strokeWidth: strokeWidth,
  });
  return { x1, y1, x2, y2, drawnShape: roughElement };
};

const getElementAtPosition = (
  clientX: number,
  clientY: number,
  elements: Element[]
): Partial<Element> & { selectedPosition: SelectedPosition } => {
  let position: SelectedPosition = null;

  const foundElement = elements.find(({ type, x1, y1, x2, y2, stroke }) => {
    position = positionWithinShape(
      clientX,
      clientY,
      x1,
      y1,
      x2 || 0,
      y2 || 0,
      type,
      stroke
    );
    return position !== null;
  });

  return {
    ...(foundElement || {}),
    selectedPosition: position,
  };
};

const positionWithinShape = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: Shapes,
  stroke?: number[][]
): SelectedPosition => {
  switch (type) {
    case "rectangle":
      return positionOnRectangle(clientX, clientY, x1, y1, x2, y2);
    case "line":
      return positionOnLine(
        point(clientX, clientY),
        point(x1, y1),
        point(x2, y2)
      );
    case "pencil":
      return positionOnPencil(point(clientX, clientY), stroke || []);
    case "text":
      return clientX >= x1 && clientY >= y1 && clientX <= x2 && clientY <= y2
        ? "inside"
        : null;
    default:
      return null;
  }
};

const nearPoint = (x1: number, y1: number, x2: number, y2: number): boolean => {
  return Math.abs(x2 - x1) < 10 && Math.abs(y2 - y1) < 10;
};

const point = (x: number, y: number): Point => ({ x, y });

const positionOnPencil = (client: Point, stroke: number[][]) => {
  if (!stroke || stroke.length === 0) return null;
  let a = stroke[0];

  for (let i = 1; i < stroke.length; i++) {
    const b = stroke[i];
    const res = positionOnLine(client, point(a[0], a[1]), point(b[0], b[1]));
    if (res) {
      return res;
    }

    a = b;
  }
  return null;
};

const positionOnRectangle = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): SelectedPosition => {
  const topLeft = nearPoint(clientX, clientY, x1, y1) ? "tl" : null;
  const topRight = nearPoint(clientX, clientY, x2, y1) ? "tr" : null;
  const bottomLeft = nearPoint(clientX, clientY, x1, y2) ? "bl" : null;
  const bottomRight = nearPoint(clientX, clientY, x2, y2) ? "br" : null;

  const top = positionOnLine(
    point(clientX, clientY),
    point(x1, y1),
    point(x2, y1)
  )
    ? "t"
    : null;
  const right = positionOnLine(
    point(clientX, clientY),
    point(x2, y1),
    point(x2, y2)
  )
    ? "r"
    : null;
  const bottom = positionOnLine(
    point(clientX, clientY),
    point(x1, y2),
    point(x2, y2)
  )
    ? "b"
    : null;
  const left = positionOnLine(
    point(clientX, clientY),
    point(x1, y1),
    point(x1, y2)
  )
    ? "l"
    : null;

  const inside =
    clientX >= x1 && clientY >= y1 && clientX <= x2 && clientY <= y2
      ? "inside"
      : null;

  return (
    topLeft ||
    topRight ||
    bottomLeft ||
    bottomRight ||
    top ||
    right ||
    bottom ||
    left ||
    inside
  );
};

const positionOnLine = (
  clientPoint: Point,
  a: Point,
  b: Point
): SelectedPosition => {
  const offset =
    distance(a, b) - distance(a, clientPoint) - distance(b, clientPoint);
  const inside = Math.abs(offset) < 1 ? "inside" : null;

  const start = nearPoint(clientPoint.x, clientPoint.y, a.x, a.y)
    ? "start"
    : null;
  const end = nearPoint(clientPoint.x, clientPoint.y, b.x, b.y) ? "end" : null;
  return inside || start || end;
};

const distance = (a: Point, b: Point): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const createFreeHand = (points: number[][], color: string) => {
  const path = new Path2D();
  const outline = getStroke(points, {
    ...DEFAULT_STROKE_OPTIONS,
    size: points[0][2] ? points[0][2] * 30 : DEFAULT_STROKE_OPTIONS.size,
  });

  if (outline.length < 2)
    return {
      path,
      x1: outline[0][0],
      y1: outline[0][1],
      x2: outline[0][0],
      y2: outline[0][1],
    };

  path.moveTo(outline[0][0], outline[0][1]);

  let minX = outline[0][0];
  let maxX = outline[0][0];
  let minY = outline[0][1];
  let maxY = outline[0][1];

  // Draw smooth curves through points
  for (let i = 1; i < outline.length - 1; i++) {
    const xc = (outline[i][0] + outline[i + 1][0]) / 2;
    const yc = (outline[i][1] + outline[i + 1][1]) / 2;
    path.quadraticCurveTo(outline[i][0], outline[i][1], xc, yc);

    // updating the min's and max's
    minX = Math.min(outline[i][0], minX);
    maxX = Math.max(outline[i][0], maxX);
    minY = Math.min(outline[i][1], minY);
    maxY = Math.max(outline[i][1], maxY);
  }

  path.closePath();
  return { path, x1: minX, y1: minY, x2: maxX, y2: maxY };
};

const createElement = (
  x1: number = 0,
  y1: number = 0,
  x2: number = 0,
  y2: number = 0,
  type: Shapes,
  options: {
    text?: string;
    stroke?: number[][];
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    strokeWidth?: number;
  } = {}
): Element => {
  const { text = "", stroke, color = "#000000", fontSize = 16, fontFamily = "Arial", strokeWidth = 1 } = options;
  
  switch (type) {
    case "rectangle":
      return {
        ...createRectangle(x1, y1, x2 - x1, y2 - y1, color, strokeWidth),
        type,
        id: crypto.randomUUID(),
        color,
        strokeWidth,
      };
    case "line":
      return { 
        ...createLine(x1, y1, x2, y2, color, strokeWidth), 
        type, 
        id: crypto.randomUUID(),
        color,
        strokeWidth,
      };
    case "pencil":
      return {
        ...createFreeHand(stroke || [[x1, y1, 0.5]], color),
        stroke,
        type,
        id: crypto.randomUUID(),
        color,
        strokeWidth,
      };
    case "text":
      return { 
        x1, 
        y1, 
        x2, 
        y2, 
        text, 
        type, 
        id: crypto.randomUUID(),
        color,
        fontSize,
        fontFamily,
      };
    default:
      throw new Error(`Unsupported shape type: ${type}`);
  }
};

const adjustElementCoordinates = (
  type: Shapes,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { newX1: number; newY1: number; newX2: number; newY2: number } => {
  if (type === "rectangle") {
    const MinX = Math.min(x1, x2);
    const MaxX = Math.max(x1, x2);
    const MinY = Math.min(y1, y2);
    const MaxY = Math.max(y1, y2);

    return {
      newX1: MinX,
      newY1: MinY,
      newX2: MaxX,
      newY2: MaxY,
    };
  } else {
    if (x1 < x2 || (x2 === x1 && y1 < y2)) {
      return {
        newX1: x1,
        newY1: y1,
        newX2: x2,
        newY2: y2,
      };
    } else {
      return {
        newX1: x2,
        newY1: y2,
        newX2: x1,
        newY2: y1,
      };
    }
  }
};

const usePressedKeys = () => {
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys((prevKeys) => new Set(prevKeys).add(event.key));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys((prevKeys) => {
        const updatedKeys = new Set(prevKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return pressedKeys;
};

// for moving
const updateEachStroke = (
  strokes: number[][],
  clientX: number,
  clientY: number,
  offsetX: number[],
  offsetY: number[]
) => {
  if (!strokes) return undefined;

  const newStrokes = [...strokes];
  for (let i = 0; i < newStrokes.length; i++) {
    newStrokes[i][0] = clientX - offsetX[i];
    newStrokes[i][1] = clientY - offsetY[i];
  }

  return newStrokes;
};

export function WhiteBoard() {
  const [elements, setElements] = useAtom(elementsAtom);
  const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);
  const [history, setHistory] = useAtom(historyAtom);
  
  const factor = 1;
  const boardRef = useRef<HTMLCanvasElement>(null);
  const textElementRef = useRef<HTMLTextAreaElement>(null);
  
  const [tool, setTool] = useAtom(toolAtom);
  const [color, setColor] = useAtom(colorAtom);
  const [strokeWidth, setStrokeWidth] = useAtom(strokeWidthAtom);
  const [fontSize, setFontSize] = useAtom(fontSizeAtom);
  const [fontFamily, setFontFamily] = useAtom(fontFamilyAtom);
  const [fontColor, setFontColor] = useAtom(fontColorAtom);
  const [selectedElement, setSelectedElement] = useAtom(selectedElementAtom);

  const [action, setAction] = useState<Action>("none");
  const [panOffset, setPanOffSet] = useState<Point>(point(50, 50));
  const [startPanMousePosition, setStartPanMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [scaleOffset, setScaleOffset] = useState<Point>({ x: 0, y: 0 });
  
  const pressedKeys = usePressedKeys();

  // History management functions
  const setElementsWithHistory = (newElements: Element[], overWrite = false) => {
    if (overWrite) {
      const newHistory = [...history];
      newHistory[historyIndex] = newElements;
      setHistory(newHistory);
    } else {
      const newHistory = [...history].slice(0, historyIndex + 1);
      setHistory([...newHistory, newElements]);
      setHistoryIndex(historyIndex + 1);
    }
    setElements(newElements);
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  }, [historyIndex, history, setHistoryIndex, setElements]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  }, [historyIndex, history, setHistoryIndex, setElements]);

  useEffect(() => {
    if (action === "writing" && textElementRef.current) {
      // Small timeout to ensure the DOM has updated
      setTimeout(() => {
        if (textElementRef.current) {
          textElementRef.current.focus();
        }
      }, 0);
    }
  }, [action, textElementRef]);

  const resizeCanvas = useCallback(() => {
    if (!boardRef.current) return;

    boardRef.current.width = window.innerWidth * factor;
    boardRef.current.height = window.innerHeight * factor;
    boardRef.current.style.width = window.innerWidth + "px";
    boardRef.current.style.height = window.innerHeight + "px";
  }, []);

  useEffect(() => {
    const panOrZoomFunction = (event: WheelEvent) => {
      if (pressedKeys.has("Meta") || pressedKeys.has("Control")) {
        onZoom(event.deltaY * -0.01);
      } else {
        setPanOffSet((prevState) => ({
          x: prevState.x - event.deltaX,
          y: prevState.y - event.deltaY,
        }));
      }
    };

    document.addEventListener("wheel", panOrZoomFunction);
    return () => {
      document.removeEventListener("wheel", panOrZoomFunction);
    };
  }, [pressedKeys]);

  const selectTool = (tool: TOOL) => {
    setTool(tool);
  };

  useLayoutEffect(() => {
    const canvas = boardRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rc = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;

    const scaleOffsetX = (scaledWidth - canvas.width) / scale;
    const scaleOffsetY = (scaledHeight - canvas.height) / scale;

    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });

    ctx.save();

    ctx.translate(
      panOffset.x * scale - scaleOffsetX,
      panOffset.y * scale - scaleOffsetY
    );
    ctx.scale(scale, scale);
    elements.forEach((element: Element) => {
      drawElement(rc, ctx, element);
    });

    if (selectedElement) {
      const x1 = Math.min(selectedElement.x1, selectedElement.x2 || selectedElement.x1) - 5;
      const y1 = Math.min(selectedElement.y1, selectedElement.y2 || selectedElement.y1) - 5;
      const width = Math.abs((selectedElement.x2 || selectedElement.x1) - selectedElement.x1) + 10;
      const height = Math.abs((selectedElement.y2 || selectedElement.y1) - selectedElement.y1) + 10;

      const container = generator.rectangle(x1, y1, width, height, {
        strokeLineDash: [5, 10],
        stroke: "rgba(48, 183, 248, 0.8)",
        strokeWidth: 1.2,
      });

      rc.draw(container);
    }

    ctx.restore();
  }, [elements, selectedElement, panOffset, scale]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const updateElement = (
    id: string,
    index: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: Shapes,
    options: {
      text?: string;
      stroke?: number[][];
      color?: string;
      fontSize?: number;
      fontFamily?: string;
      strokeWidth?: number;
    } = {}
  ) => {
    const { text = "", stroke, color, fontSize, fontFamily, strokeWidth } = options;
    
    // Get current element to preserve properties if not explicitly provided
    const currentElement = elements[index];
    const updatedOptions = {
      text: text || currentElement.text || "",
      stroke,
      color: color || currentElement.color || "#000000",
      fontSize: fontSize || currentElement.fontSize || 16,
      fontFamily: fontFamily || currentElement.fontFamily || "Arial",
      strokeWidth: strokeWidth || currentElement.strokeWidth || 1
    };
    
    const updatedElement = createElement(
      x1,
      y1,
      x2,
      y2,
      type,
      updatedOptions
    );

    const newElements = [...elements];
    newElements[index] = { ...updatedElement, id };

    setElementsWithHistory(newElements, true);

    return updatedElement;
  };

  const getMouseCoordinates = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const x = (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
    const y = (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;

    return { x, y };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    if (action === "writing") {
      return;
    }

    if (tool === "pan") {
      setStartPanMousePosition({ x: clientX, y: clientY });
      setAction("panning");
      return;
    }

    if (tool === "select") {
      const element = getElementAtPosition(clientX, clientY, elements);

      if (element.selectedPosition) {
        if (!element.x1 && element.x1 !== 0) return; // Safety check

        const offsetX: number[] = [];
        const offsetY: number[] = [];

        if (element.type === "pencil" && element.stroke) {
          for (let i = 0; i < element.stroke.length; i++) {
            offsetX.push(clientX - element.stroke[i][0]);
            offsetY.push(clientY - element.stroke[i][1]);
          }
        } else {
          offsetX.push(clientX - element.x1);
          offsetY.push(clientY - element.y1);
        }

        const fullElement = elements.find((el) => el.id === element.id);
        if (!fullElement) return;

        setSelectedElement({
          ...fullElement,
          offsetX,
          offsetY,
          selectedPosition: element.selectedPosition,
        });

        if (element.selectedPosition === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      } else if (selectedElement) {
        // check if it is in the highlighted zone
        const isInside = positionOnRectangle(
          clientX,
          clientY,
          selectedElement.x1 - 5,
          selectedElement.y1 - 5,
          selectedElement.x2 || selectedElement.x1 + 10,
          selectedElement.y2 || selectedElement.y1 + 10
        );

        if (!isInside) {
          setSelectedElement(null);
          setAction("selecting");
        } else if (isInside === "inside") {
          const offsetX: number[] = [];
          const offsetY: number[] = [];

          if (selectedElement.type === "pencil" && selectedElement.stroke) {
            for (let i = 0; i < selectedElement.stroke.length; i++) {
              offsetX.push(clientX - selectedElement.stroke[i][0]);
              offsetY.push(clientY - selectedElement.stroke[i][1]);
            }
          } else {
            offsetX.push(clientX - selectedElement.x1);
            offsetY.push(clientY - selectedElement.y1);
          }

          setSelectedElement({
            ...selectedElement,
            offsetX,
            offsetY,
            selectedPosition: isInside,
          });

          setAction("moving");
        } else {
          setSelectedElement({
            ...selectedElement,
            selectedPosition: isInside,
          });
          setAction("resizing");
        }
      }
    } else if (tool === "text") {
      setAction("writing");

      const newElement: Element = {
        type: "text",
        id: crypto.randomUUID(),
        x1: clientX,
        y1: clientY,
        text: "",
        color: fontColor,
        fontSize,
        fontFamily,
      };

      setSelectedElement(newElement);
    } else {
      setAction("drawing");
      setSelectedElement(null);

      if (tool === "rectangle" || tool === "line") {
        const newElement = createElement(
          clientX,
          clientY,
          clientX,
          clientY,
          tool,
          { color, strokeWidth }
        );

        setElementsWithHistory([...elements, newElement]);
      } else if (tool === "pencil") {
        const newElement = createElement(0, 0, 0, 0, "pencil", {
          stroke: [[clientX, clientY, event.pressure || 0.5]],
          color,
          strokeWidth
        });
        setElementsWithHistory([...elements, newElement]);
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);
    
    if (action === "moving" && selectedElement) {
      const index = elements.findIndex((element) => {
        return selectedElement.id === element.id;
      });

      if (index === -1) return;

      const { x1, y1, x2, y2, offsetX, offsetY, type, id, stroke, color, fontSize, fontFamily, strokeWidth, text } =
        selectedElement;
      const width = (x2 || x1) - x1;
      const height = (y2 || y1) - y1;

      if (selectedElement.type === "pencil") {
        const newStrokes = stroke
          ? updateEachStroke(
              stroke,
              clientX,
              clientY,
              offsetX as number[],
              offsetY as number[]
            )
          : undefined;

        const updatedElement = updateElement(
          id,
          index,
          0,
          0,
          0,
          0,
          "pencil",
          { 
            stroke: newStrokes,
            color
          }
        );

        setSelectedElement({
          ...selectedElement,
          x1: updatedElement.x1,
          y1: updatedElement.y1,
          x2: updatedElement.x2,
          y2: updatedElement.y2,
          stroke: [...(newStrokes as number[][])],
        });
      } else if (selectedElement.type === "text") {
        const newX1 = clientX - ((offsetX as number[])[0] ?? 0);
        const newY1 = clientY - ((offsetY as number[])[0] ?? 0);
        const newX2 = newX1 + width;
        const newY2 = newY1 + height;
        
        updateElement(
          id,
          index,
          newX1,
          newY1,
          newX2,
          newY2,
          type,
          {
            text,
            color,
            fontSize,
            fontFamily
          }
        );
        
        const updatedElement = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        };
        setSelectedElement(updatedElement);
      } else {
        const newX1 = clientX - ((offsetX as number[])[0] ?? 0);
        const newY1 = clientY - ((offsetY as number[])[0] ?? 0);
        const newX2 = newX1 + width;
        const newY2 = newY1 + height;

        updateElement(
          id, 
          index, 
          newX1, 
          newY1, 
          newX2, 
          newY2, 
          type, 
          { color, strokeWidth }
        );

        const updatedElement = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        };
        setSelectedElement(updatedElement);
      }
    }

    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      if (lastIndex < 0) return;

      if (tool === "pencil") {
        const { x1, y1, id, type, stroke, color, strokeWidth } = elements[lastIndex];
        const newStroke = [
          ...(stroke as number[][]),
          [clientX, clientY, event.pressure || 0.5],
        ];
        updateElement(
          id,
          lastIndex,
          x1,
          y1,
          clientX,
          clientY,
          type,
          {
            stroke: newStroke,
            color,
            strokeWidth
          }
        );
      } else if (tool === "rectangle" || tool ===
*/
