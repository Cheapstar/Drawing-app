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

const createRectangle = (x1: number, y1: number, x2: number, y2: number) => {
  const roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  return { x1, y1, x2, y2, drawnShape: roughElement };
};
const createLine = (x1: number, y1: number, x2: number, y2: number) => {
  const roughElement = generator.line(x1, y1, x2, y2);
  return { x1, y1, x2, y2, drawnShape: roughElement };
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
      return { ...createRectangle(x1, y1, x2, y2), type };
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
      requestAnimationFrame(() => {
        rc.draw(element.drawnShape);
      });
    });
  }, [elements]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const [clientX, clientY] = [event.clientX, event.clientY];
    if (tool === "select") {
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

        setElements([...elements, newElement]);
      }
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const [clientX, clientY] = [event.clientX, event.clientY];
    if (action === "moving") {
      // move element at clientX , clientY
    }

    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      const { x1, y1 } = elements[lastIndex];

      const updatedElement = createElement(
        x1,
        y1,
        clientX,
        clientY,
        tool as Shapes
      );

      const newElements = [...elements];
      newElements[lastIndex] = updatedElement;

      setElements(newElements);
    }
  };

  const handlePointerUp = (
    event:
      | React.PointerEvent<HTMLCanvasElement>
      | React.MouseEvent<HTMLDivElement>
  ) => {
    if (action === "drawing") {
      const [clientX, clientY] = [event.clientX, event.clientY];
      const lastIndex = elements.length - 1;
      const { x1, y1 } = elements[lastIndex];
      const updatedElement = createElement(
        x1,
        y1,
        clientX,
        clientY,
        tool as Shapes
      );

      const newElements = [...elements];
      newElements[lastIndex] = updatedElement;

      setElements(newElements);
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
export type Action = "drawing" | "selecting" | "moving" | "none";
export type Element = {
  type: Shapes;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  drawnShape: Drawable;
};

export type Shapes = "rectangle" | "line";

export type Point = {
  x: number;
  y: number;
};
