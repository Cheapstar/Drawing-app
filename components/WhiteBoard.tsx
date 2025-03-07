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

const generator = rough.generator();

const createRectangle = (
  x1: number,
  y1: number,
  width: number,
  height: number
) => {
  const roughElement = generator.rectangle(x1, y1, width, height);
  return { x1, y1, x2: x1 + width, y2: y1 + height, drawnShape: roughElement };
};
const createLine = (x1: number, y1: number, x2: number, y2: number) => {
  const roughElement = generator.line(x1, y1, x2, y2);
  return { x1, y1, x2, y2, drawnShape: roughElement };
};

const getElementAtPosition = (
  clientX: number,
  clientY: number,
  elements: Element[]
) => {
  let position: SelectedPosition = null;

  return {
    ...elements.find(({ type, x1, y1, x2, y2 }) => {
      position = positionWithinShape(clientX, clientY, x1, y1, x2, y2, type);
      return position;
    }),
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
  type: Shapes
) => {
  switch (type) {
    case "rectangle":
      return positionOnRectangle(clientX, clientY, x1, y1, x2, y2);
    case "line":
      return positionOnLine(
        point(clientX, clientY),
        point(x1, y1),
        point(x2, y2)
      );
  }
};

const nearPoint = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.abs(x2 - x1) < 10 && Math.abs(y2 - y1) < 10;
};

const point = (x: number, y: number) => ({ x, y });

const positionOnRectangle = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
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

const positionOnLine = (clientPoint: Point, a: Point, b: Point) => {
  const offset =
    distance(a, b) - distance(a, clientPoint) - distance(b, clientPoint);
  const inside = Math.abs(offset) < 1 ? "inside" : null;

  const start = nearPoint(clientPoint.x, clientPoint.y, a.x, a.y)
    ? "start"
    : null;
  const end = nearPoint(clientPoint.x, clientPoint.y, b.x, b.y) ? "end" : null;
  return inside || start || end;
};

const distance = (a: Point, b: Point) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const createElement = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  type: Shapes
) => {
  switch (type) {
    case "rectangle":
      return {
        ...createRectangle(x1, y1, x2 - x1, y2 - y1),
        type,
        id: crypto.randomUUID(),
      };
    case "line":
      return { ...createLine(x1, y1, x2, y2), type };
  }
};

const adjustElementCoordinates = (
  type: Shapes,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
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

export function WhiteBoard() {
  const factor = 1;
  const boardRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<TOOL>("select");

  const [action, setAction] = useState<Action>("none");

  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<Element | null>();

  const resizeCanvas = useCallback(() => {
    if (!boardRef.current) return;

    boardRef.current.width = window.innerWidth * factor;
    boardRef.current.height = window.innerHeight * factor;
    boardRef.current.style.width = window.innerWidth + "px";
    boardRef.current.style.height = window.innerHeight + "px";
  }, []);

  const selectTool = (tool: TOOL) => {
    setTool(tool);
  };

  useLayoutEffect(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    const rc = rough.canvas(canvas);

    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element) => {
      rc.draw(element.drawnShape);
    });

    if (selectedElement) {
      const x1 = selectedElement.x1 - 5;
      const y1 = selectedElement.y1 - 5;
      const width = selectedElement.x2 - selectedElement.x1 + 10;
      const height = selectedElement.y2 - selectedElement.y1 + 10;
      const container = generator.rectangle(x1, y1, width, height, {
        strokeLineDash: [5, 10],
        stroke: "rgba(48, 183, 248, 0.8)",
        strokeWidth: 1.2,
      });
      rc.draw(container);
    }
  }, [elements, selectedElement]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const updateElement = (
    id: string,
    index: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: Shapes
  ) => {
    const updatedElement = createElement(x1, y1, x2, y2, type);

    const newElements = [...elements];
    newElements[index] = { ...updatedElement, id };

    setElements(newElements);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const [clientX, clientY] = [event.clientX, event.clientY];
    if (tool === "select") {
      const element = getElementAtPosition(
        clientX,
        clientY,
        elements
      ) as Element;

      console.log("Element", element);
      if (element.selectedPosition) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;

        setSelectedElement({ ...element, offsetX, offsetY });
        console.log("SelectedElement in PointerDown", element);

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
          selectedElement!.x1 - 5,
          selectedElement!.y1 - 5,
          selectedElement!.x2 + 10,
          selectedElement!.y2 + 10
        );

        if (!isInside) {
          setSelectedElement(null);
          setAction("selecting");
        } else if (isInside === "inside") {
          console.log("Inside the Highlighted Zone", isInside);
          const offsetX = clientX - selectedElement!.x1;
          const offsetY = clientY - selectedElement!.y1;
          setSelectedElement({
            ...selectedElement,
            offsetX,
            offsetY,
          } as Element);
          setAction("moving");
        } else {
          console.log("resizing", isInside);
          setSelectedElement({
            ...selectedElement,
            selectedPosition: isInside,
          });
          setAction("resizing");
        }
      }
    } else {
      setAction("drawing");
      setSelectedElement(null);

      if (tool === "rectangle" || tool == "line") {
        const newElement = createElement(
          clientX,
          clientY,
          clientX,
          clientY,
          tool
        );

        setElements([...elements, { ...newElement, id: crypto.randomUUID() }]);
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const [clientX, clientY] = [event.clientX, event.clientY];
    if (action === "moving") {
      // move element at clientX , clientY
      console.log("SelectedElement in PointerMove", selectedElement);

      const index = elements.findIndex((element) => {
        return selectedElement?.id === element.id;
      });

      const { x1, y1, x2, y2, offsetX, offsetY, type } =
        selectedElement as Element;
      const width = x2 - x1;
      const height = y2 - y1;

      // new positions and size
      const newX1 = clientX - (offsetX as number);
      const newY1 = clientY - (offsetY as number);
      const newX2 = newX1 + width;
      const newY2 = newY1 + height;
      const id = crypto.randomUUID();
      updateElement(id, index, newX1, newY1, newX2, newY2, type as Shapes);

      const updatedElement = {
        ...selectedElement,
        x1: newX1,
        y1: newY1,
        x2: newX2,
        y2: newY2,
        id,
      };
      setSelectedElement(updatedElement as Element);
    }

    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      const { x1, y1 } = elements[lastIndex];
      const id = crypto.randomUUID();

      updateElement(id, lastIndex, x1, y1, clientX, clientY, tool as Shapes);
    }

    if (action === "resizing") {
      console.log("Resizing", selectedElement);
      const { id, x1, y1, x2, y2, type, selectedPosition } =
        selectedElement as Element;
      const index = elements.findIndex(
        (element) => selectedElement?.id === element.id
      );

      switch (selectedPosition) {
        case "b":
          updateElement(id, index, x1, y1, x2, clientY, type);
          setSelectedElement({ ...selectedElement, y2: clientY } as Element);
          break;

        case "t":
          updateElement(id, index, x1, clientY, x2, y2, type);
          setSelectedElement({ ...selectedElement, y1: clientY } as Element);
          break;

        case "l":
          updateElement(id, index, clientX, y1, x2, y2, type);
          setSelectedElement({ ...selectedElement, x1: clientX } as Element);
          break;

        case "r":
          updateElement(id, index, x1, y1, clientX, y2, type);
          setSelectedElement({ ...selectedElement, x2: clientX } as Element);
          break;

        case "tl":
          updateElement(id, index, clientX, clientY, x2, y2, type);
          setSelectedElement({
            ...selectedElement,
            x1: clientX,
            y1: clientY,
          } as Element);
          break;

        case "tr":
          updateElement(id, index, x1, clientY, clientX, y2, type);
          setSelectedElement({
            ...selectedElement,
            x2: clientX,
            y1: clientY,
          } as Element);
          break;

        case "bl":
          updateElement(id, index, clientX, y1, x2, clientY, type);
          setSelectedElement({
            ...selectedElement,
            x1: clientX,
            y2: clientY,
          } as Element);
          break;

        case "br":
          updateElement(id, index, x1, y1, clientX, clientY, type);
          setSelectedElement({
            ...selectedElement,
            x2: clientX,
            y2: clientY,
          } as Element);
          break;
      }
    }
  };

  const handlePointerUp = () => {
    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      const { x1, y1, x2, y2, type, id } = elements[lastIndex];
      const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
        type,
        x1,
        y1,
        x2,
        y2
      );

      updateElement(id, lastIndex, newX1, newY1, newX2, newY2, type as Shapes);
    }

    setAction("none");
  };

  return (
    <div>
      <div className="fixed top-2 left-6">
        <ToolBar selectTool={selectTool}></ToolBar>
      </div>
      <canvas
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      ></canvas>
    </div>
  );
}

export type TOOL = "rectangle" | "line" | "move" | "select";
export type Action = "drawing" | "selecting" | "moving" | "resizing" | "none";
export type Element = {
  type: Shapes;
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offsetX?: number;
  offsetY?: number;
  selectedPosition?: SelectedPosition;
  drawnShape: Drawable;
};

export type Shapes = "rectangle" | "line";

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
