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
import {
  colorAtom,
  fontFamilyAtom,
  fontSizeAtom,
  strokeWidthAtom,
} from "@/store/store";
import { useAtom } from "jotai";
import { Menu } from "./Menu";

// Define types first to avoid forward reference issues
export type TOOL =
  | "rectangle"
  | "line"
  | "move"
  | "select"
  | "pencil"
  | "text"
  | "pan"
  | "eraser";
export type Action =
  | "drawing"
  | "selecting"
  | "moving"
  | "resizing"
  | "writing"
  | "panning"
  | "erasing"
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
  opacity?: number;
  status?: string;
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

const positionOnPencil = (client: Point, stroke?: number[][]) => {
  if (!stroke || stroke.length < 2) return null;
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
  console.log("In FreeHand", points);

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
      if (element.opacity) {
        ctx.globalAlpha = element.opacity;
      }
      ctx.fill(element.path as Path2D);
      ctx.restore();
      break;
    case "text":
      ctx.save();
      ctx.textBaseline = "top";
      ctx.fillStyle = element.color as string;
      console.log("FontSize", element.fontSize);
      if (element.opacity) {
        ctx.globalAlpha = element.opacity;
      }
      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillText(element.text as string, element.x1, element.y1 as number);
      ctx.restore();
      break;
  }
};

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

  const textElementRef = useRef<HTMLTextAreaElement>(null);
  const [fontSize, setFontSize] = useAtom(fontSizeAtom);
  const [fontFamily, setFontFamily] = useAtom(fontFamilyAtom);

  const [color] = useAtom(colorAtom);
  const [strokeWidth] = useAtom(strokeWidthAtom);

  const [eraseElements, setEraseElements] = useState<
    Element[] | Partial<Element>[]
  >([]);

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
      setPanOffSet((prevState) => ({
        x: prevState.x - event.deltaX,
        y: prevState.y - event.deltaY,
      }));
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

    const scaleOffsetX = (scaledWidth - canvas.width) / 2;
    const scaleOffsetY = (scaledHeight - canvas.height) / 2;

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

      ctx.save();
      ctx.strokeStyle = "#6965db";
      ctx.strokeRect(x1, y1, width, height);
      ctx.restore();
    }

    ctx.restore();
  }, [elements, selectedElement, panOffset, scale, action]);

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
      fontSize,
      fontFamily,
      opacity,
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
    if (!updatedElement) return;

    const newElements = [...elements];
    newElements[index] = {
      ...updatedElement,
      id,
      fontSize: fontSize || 0,
      fontFamily: fontFamily || "",
      opacity,
    };

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

    if (tool === "eraser") {
      const element = getElementAtPosition(clientX, clientY, elements);

      setAction("erasing");
      if (element.id && element.selectedPosition) {
        const index = elements.findIndex(({ id }) => id === element.id);

        if (index !== -1) {
          // Add to eraseElements if not already there
          if (!eraseElements.some((e) => e.id === element.id)) {
            setEraseElements([...eraseElements, element]);

            // Update opacity to show it's being erased
            const updatedElements = [...elements];
            updatedElements[index] = {
              ...updatedElements[index],
              opacity: 0.5,
            };
            updateElement(index, { ...element, opacity: 0.5 });
          }
        }
      }
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
          const offsetX = [];
          const offsetY = [];

          console.log("Element inside Highlighted Zone", selectedElement);

          if (selectedElement.type === "pencil" && selectedElement.stroke) {
            offsetX.push(clientX);
            offsetY.push(clientY);
          }
          setElements((prevState) => prevState);
          setSelectedElement({
            ...selectedElement,
            offsetX,
            offsetY,
            selectedPosition: isInside,
          });
          setAction("resizing");
        }
      }
    }

    if (tool === "text") {
      console.log("text");
      setAction("writing");

      const newElement: Element = {
        type: "text",
        id: crypto.randomUUID(),
        x1: clientX,
        y1: clientY,
        text: "",
        color,
        fontSize,
        fontFamily,
      };

      setSelectedElement(newElement);
      console.log("Rendering the text");
    }

    if (tool === "pencil" || tool === "rectangle" || tool === "line") {
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
    if (action === "moving") {
      // move element at clientX , clientY
      if (!selectedElement || !selectedElement.id) return;

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
        fontSize: SelectedFontSize,
        fontFamily: SelectedFontFamily,
      } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;

      // new positions and size

      if (selectedElement.type === "pencil") {
        if (
          !selectedElement.stroke ||
          !selectedElement.offsetX ||
          !selectedElement.offsetY
        )
          return;
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
          fontSize: SelectedFontSize,
          fontFamily: SelectedFontFamily,
        });
        const updatedElement = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
          fontSize: SelectedFontSize,
          fontFamily: SelectedFontFamily,
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

      const currentElement = elements[lastIndex];
      if (!currentElement) return;

      const {
        x1,
        y1,
        id,
        type,
        stroke,
        color: currentColor,
        strokeWidth: SelectedStrokeWidth,
      } = currentElement;
      if (tool == "pencil") {
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
      if (selectedElement.type === "text") return;
      console.log("Resizing", selectedElement);
      const {
        id,
        x1,
        y1,
        x2,
        y2,
        type,
        selectedPosition,
        offsetX,
        offsetY,
        color: currentColor,
        stroke,
        strokeWidth: SelectedStrokeWidth,
      } = selectedElement;

      if (!selectedPosition) return;

      const index = elements.findIndex(
        (element) => selectedElement.id === element.id
      );
      if (index === -1) return;

      console.log("Selected position", selectedPosition);
      let updatedStrokes = type === "pencil" ? [...(stroke as number[][])] : [];

      const width = x2 - x1;
      const height = y2 - y1;

      function scaleStroke(
        stroke: number[][],
        scaleX: number,
        scaleY: number,
        originX: number,
        originY: number
      ) {
        return stroke.map(([px, py]) => [
          originX + (px - originX) * scaleX,
          originY + (py - originY) * scaleY,
        ]);
      }

      let scaleX = 1,
        scaleY = 1;
      let newX1 = x1,
        newY1 = y1,
        newX2 = x2,
        newY2 = y2;
      let referenceX = x1,
        referenceY = y1; // Default reference point

      switch (selectedPosition) {
        case "b":
          scaleY = height !== 0 ? (clientY - y1) / height : 1;
          referenceY = y1;
          newY2 = clientY;
          break;

        case "t":
          scaleY = height !== 0 ? (y2 - clientY) / height : 1;
          referenceY = y2;
          newY1 = clientY;
          break;

        case "l":
          scaleX = width !== 0 ? (x2 - clientX) / width : 1;
          referenceX = x2;
          newX1 = clientX;
          break;

        case "r":
          scaleX = width !== 0 ? (clientX - x1) / width : 1;
          referenceX = x1;
          newX2 = clientX;
          break;
        case "start":
        case "tl":
          scaleX = width !== 0 ? (x2 - clientX) / width : 1;
          scaleY = height !== 0 ? (y2 - clientY) / height : 1;
          referenceX = x2;
          referenceY = y2;
          newX1 = clientX;
          newY1 = clientY;
          break;

        case "tr":
          scaleX = width !== 0 ? (clientX - x1) / width : 1;
          scaleY = height !== 0 ? (y2 - clientY) / height : 1;
          referenceX = x1;
          referenceY = y2;
          newX2 = clientX;
          newY1 = clientY;
          break;

        case "bl":
          scaleX = width !== 0 ? (x2 - clientX) / width : 1;
          scaleY = height !== 0 ? (clientY - y1) / height : 1;
          referenceX = x2;
          referenceY = y1;
          newX1 = clientX;
          newY2 = clientY;
          break;

        case "end":
        case "br":
          scaleX = width !== 0 ? (clientX - x1) / width : 1;
          scaleY = height !== 0 ? (clientY - y1) / height : 1;
          referenceX = x1;
          referenceY = y1;
          newX2 = clientX;
          newY2 = clientY;
          break;
      }

      if (type === "pencil") {
        updatedStrokes = scaleStroke(
          updatedStrokes,
          scaleX,
          scaleY,
          referenceX,
          referenceY
        );
      }

      updateElement(index, {
        id,
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
        type,
        color: currentColor,
        strokeWidth: SelectedStrokeWidth,
        stroke: updatedStrokes,
      });

      setSelectedElement({
        ...selectedElement,
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
        stroke: updatedStrokes,
      });
    }

    if (action === "panning") {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;
      setPanOffSet((prevState) => ({
        x: prevState.x + deltaX,
        y: prevState.y + deltaY,
      }));
      return;
    }

    if (action === "erasing") {
      const element = getElementAtPosition(clientX, clientY, elements);

      if (element.selectedPosition) {
        const index = elements.findIndex(({ id }) => {
          return id === element.id;
        });
        setEraseElements([...eraseElements, element]);
        updateElement(index, { ...element, opacity: 0.5 });
        return;
      } else {
        return;
      }
    }
  };

  const handlePointerUp = () => {
    console.log("Action is ", action);
    if (action === "erasing") {
      if (eraseElements.length === 0) return;

      const newElements = elements.filter(
        (element) =>
          !eraseElements.some((eraseElement) => eraseElement.id === element.id)
      );

      setElements(newElements);
      setEraseElements([]);
      setSelectedElement(null);
    }

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
    ctx?.save();
    ctx.font = `${fontSize}px ${fontFamily}`;
    const text = ctx?.measureText(textElementRef.current?.value as string);
    const height = fontSize;
    const updatedSelectedElement = {
      ...selectedElement,
      text: textElementRef.current?.value,
      x2: selectedElement.x1 + text?.width,
      y2: selectedElement.y1 + height,
    };
    console.log("SelectedElement", updatedSelectedElement);

    setElements([...elements, updatedSelectedElement]);
    ctx?.restore();
    setSelectedElement(null);
    setTool("select");
    setAction("selecting");
  };

  const onZoom = (delta: number) => {
    if (delta === 0) {
      setScale(1);
      return;
    }
    setScale((prevState) => Math.min(Math.max(prevState + delta, 0.1), 2));
  };
  const getCursorForTool = () => {
    if (action === "moving") return "move";
    if (action === "resizing") return "nwse-resize";
    if (action === "panning") return "grabbing";
    return TOOLS[tool]?.cursor || "default";
  };

  return (
    <div onPointerUp={handlePointerUp}>
      <div
        className="fixed top-2 left-6"
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <ToolBar selectTool={selectTool}></ToolBar>
      </div>
      <div
        className="fixed bottom-5 left-6"
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <UndoRedo
          undo={undo}
          redo={redo}
        ></UndoRedo>
      </div>
      <div
        className="fixed bottom-5 right-6"
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <ZoomButtons
          scale={scale}
          onZoom={onZoom}
        ></ZoomButtons>
      </div>
      <div
        className="fixed top-28 left-5 p-4 rounded-md shadow-lg bg-white"
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <Menu></Menu>
      </div>

      {action === "writing" && (
        <textarea
          onBlur={handleBlur}
          ref={textElementRef}
          className="fixed focus:outline-none resize-none"
          style={{
            top: selectedElement?.y1 + panOffset.y - 10,
            left: selectedElement?.x1 + panOffset.x,
            fontFamily: fontFamily,
            color: color,
            fontSize: fontSize,
          }}
          onFocus={() => console.log("Textarea focused")}
        ></textarea>
      )}
      <canvas
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="bg-white"
        style={{ cursor: getCursorForTool() }}
      ></canvas>
    </div>
  );
}

const TOOLS: Record<TOOL, { cursor: string }> = {
  rectangle: { cursor: "crosshair" },
  line: { cursor: "crosshair" },
  move: { cursor: "move" },
  select: { cursor: "default" },
  pencil: { cursor: "crosshair" },
  text: { cursor: "text" },
  pan: { cursor: "grab" },
  eraser: {
    cursor: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAANlJREFUOE9jZKAyYKSyeQzDw0AfBgYGPWjQXGJgYNiCL5jwedmHj49vtrq6OoejoyMvyJD9+/d/vnnz5o9Pnz6l4jIYl4E+7Ozsa1evXs3m6+uL4qDNmzczhIaG/vr582cwNkOxGsjHx/d8yZIlEuiGwUwGGRoTE/Pi06dPkujex2agj6mp6eJTp04J4AsrMzOzD6dPn45FdyU2A6vKysqaOjs7mfEZWF5e/rerq6uOgYGhDVkdXQykupcZqB0poCChbrKBBjJVEzZyxFEt65FVsg2P4oskrwMAC4ZwFWmZPgcAAAAASUVORK5CYII="), auto`,
  },
};
