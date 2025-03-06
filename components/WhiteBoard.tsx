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
  return elements.find(({ type, x1, y1, x2, y2 }) => {
    const ans = isWithinTheShape(clientX, clientY, x1, y1, x2, y2, type);
    console.log("WithIn Shape", ans);
    return ans;
  });
};

const isWithinTheShape = (
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
      return isPointInRectangle(clientX, clientY, x1, y1, x2, y2);
    case "line":
      return isPointOnLine(clientX, clientY, x1, y1, x2, y2);
  }
};

const isPointInRectangle = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const MinX = Math.min(x1, x2);
  const MaxX = Math.max(x1, x2);
  const MinY = Math.min(y1, y2);
  const MaxY = Math.max(y1, y2);

  return (
    clientX >= MinX && clientY >= MinY && clientX <= MaxX && clientY <= MaxY
  );
};

const isPointOnLine = (
  clientX: number,
  clientY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) => {
  const a: Point = { x: x1, y: y1 };
  const b: Point = { x: x2, y: y2 };
  const c: Point = { x: clientX, y: clientY };

  const offset = distance(a, b) - distance(a, c) - distance(b, c);
  return Math.abs(offset) < 1;
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
  }, [elements]);

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
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;

        setSelectedElement({ ...element, offsetX, offsetY });
        console.log("SelectedElement in PointerDown", element);
        setAction("moving");
      }
    } else {
      setAction("drawing");

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
  };

  const handlePointerUp = () => {
    setAction("none");
    setSelectedElement(null);
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
export type Action = "drawing" | "selecting" | "moving" | "none";
export type Element = {
  type: Shapes;
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  offsetX?: number;
  offsetY?: number;
  drawnShape: Drawable;
};

export type Shapes = "rectangle" | "line";

export type Point = {
  x: number;
  y: number;
};
