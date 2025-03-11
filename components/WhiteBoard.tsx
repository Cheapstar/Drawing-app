"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import rough from "roughjs";
import { ToolBar } from "./ToolBar";
import { UndoRedo } from "./UndoRedo";
import { ZoomButtons } from "./ZoomButtons";
import {
  colorAtom,
  darkModeAtom,
  fontFamilyAtom,
  fontSizeAtom,
  strokeWidthAtom,
  toolAtom,
} from "@/store/store";
import { useAtom } from "jotai";
import { Menu } from "./Menu";
import { DarkModeButton } from "./DarkModeButton";

import {
  TOOL,
  Element,
  Action,
  Point,
  FreehandElement,
  RectangleElement,
  LineElement,
  TextElement,
  Shapes,
} from "@/types/types";
import { useHistory } from "./utils/history";
import {
  point,
  positionOnRectangle,
  getElementAtPosition,
} from "./utils/position";
import {
  adjustElementCoordinates,
  getElementBoundingBox,
} from "./utils/elements";
import { drawElement } from "./utils/draw";

/**
 * Updates stroke coordinates for freehand elements during movement
 */
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

export function WhiteBoard() {
  const [elements, setElements, undo, redo] = useHistory([]);
  const [tool, setTool] = useAtom(toolAtom);
  const [action, setAction] = useState<Action>("none");
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [panOffset, setPanOffSet] = useState<Point>(point(0, 0));
  const [startPanMousePosition, setStartPanMousePosition] = useState<Point>(
    point(0, 0)
  );
  const [scale, setScale] = useState<number>(1);
  const [scaleOffset, setScaleOffset] = useState<Point>(point(0, 0));
  const [eraseElements, setEraseElements] = useState<Element[]>([]);
  const [color] = useAtom(colorAtom);
  const [strokeWidth] = useAtom(strokeWidthAtom);
  const [fontSize] = useAtom(fontSizeAtom);
  const [fontFamily] = useAtom(fontFamilyAtom);
  const [darkMode] = useAtom(darkModeAtom);

  const boardRef = useRef<HTMLCanvasElement>(null);
  const textElementRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when writing text
  useEffect(() => {
    if (action === "writing" && textElementRef.current) {
      setTimeout(() => {
        if (textElementRef.current) {
          textElementRef.current.focus();
        }
      }, 0);
    }
  }, [action]);

  // Handle canvas resizing
  const resizeCanvas = useCallback(() => {
    if (!boardRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    boardRef.current.width = width * dpr;
    boardRef.current.height = height * dpr;
    boardRef.current.style.width = width + "px";
    boardRef.current.style.height = height + "px";
  }, []);

  // Set up event listeners
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Handle wheel events for panning
  useEffect(() => {
    const panOrZoomFunction = (event: WheelEvent) => {
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

  // Draw the canvas
  useLayoutEffect(() => {
    const canvas = boardRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rc = rough.canvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const scaledWidth = (canvas.width * scale) / dpr;
    const scaledHeight = (canvas.height * scale) / dpr;

    const scaleOffsetX = (scaledWidth - canvas.width / dpr) / 2;
    const scaleOffsetY = (scaledHeight - canvas.height / dpr) / 2;

    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });

    ctx.save();

    // Scale for high DPR displays first
    ctx.scale(dpr, dpr);

    ctx.translate(
      panOffset.x * scale - scaleOffsetX,
      panOffset.y * scale - scaleOffsetY
    );
    ctx.scale(scale, scale);

    // Draw all elements
    elements.forEach((element: Element) => {
      drawElement(rc, ctx, element);
    });

    // Draw selection indicator
    if (selectedElement) {
      const { x1, y1, width, height } = getElementBoundingBox(selectedElement);
      ctx.save();
      ctx.strokeStyle = "#6965db";
      ctx.strokeRect(x1, y1, width, height);
      ctx.restore();
    }

    ctx.restore();
  }, [elements, selectedElement, panOffset, scale, action]);

  // Utility function to get mouse coordinates adjusted for pan and scale
  const getMouseCoordinates = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): Point => {
    const x = (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
    const y = (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;
    return { x, y };
  };

  // Update element properties
  const updateElement = (
    index: number,
    elementProps: Partial<Element> & { id: string }
  ) => {
    if (index < 0 || index >= elements.length) return;

    const element = elements[index];
    const updatedElements = [...elements];

    switch (element.type) {
      case "line":
      case "rectangle":
        updatedElements[index] = {
          ...element,
          ...elementProps,
        } as LineElement | RectangleElement;
        break;

      case "freehand":
        updatedElements[index] = {
          ...element,
          ...elementProps,
        } as FreehandElement;
        break;

      case "text":
        updatedElements[index] = {
          ...element,
          ...elementProps,
        } as TextElement;
        break;

      default:
        return;
    }

    setElements(updatedElements, true);
  };

  // Handler for pointer down events
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    if (action === "writing") return;

    // Eraser tool
    if (tool === "eraser") {
      const element = getElementAtPosition(clientX, clientY, elements);

      setAction("erasing");
      if (element.id && element.selectedPosition) {
        const index = elements.findIndex(({ id }) => id === element.id);

        if (index !== -1) {
          // Add to eraseElements if not already there
          if (!eraseElements.some((e) => e.id === element.id)) {
            setEraseElements([...eraseElements, element as Element]);

            // Update opacity to show it's being erased
            updateElement(index, { ...element, opacity: 0.5, id: element.id });
          }
        }
      }
      return;
    }

    // Pan tool
    if (tool === "pan") {
      setStartPanMousePosition({ x: clientX, y: clientY });
      setAction("panning");
      return;
    }

    // Select tool
    if (tool === "select") {
      const elementAtPosition = getElementAtPosition(
        clientX,
        clientY,
        elements
      );

      if (elementAtPosition.selectedPosition) {
        const offsetX: number[] = [];
        const offsetY: number[] = [];

        // Calculate offsets based on element type
        if (
          elementAtPosition.type === "freehand" &&
          (elementAtPosition as FreehandElement).stroke
        ) {
          const freehandElement = elementAtPosition as FreehandElement;
          for (let i = 0; i < freehandElement.stroke.length; i++) {
            offsetX.push(clientX - freehandElement.stroke[i][0]);
            offsetY.push(clientY - freehandElement.stroke[i][1]);
          }
        } else {
          offsetX.push(clientX - (elementAtPosition.x1 as number));
          offsetY.push(clientY - (elementAtPosition.y1 as number));
        }

        const fullElement = elements.find(
          (el) => el.id === elementAtPosition.id
        );
        if (!fullElement) return;

        setSelectedElement({
          ...fullElement,
          offsetX,
          offsetY,
          selectedPosition: elementAtPosition.selectedPosition,
        });

        if (elementAtPosition.selectedPosition === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      } else if (selectedElement) {
        // Check if click is in the highlighted selection zone
        const boundingBox = getElementBoundingBox(selectedElement);
        const isInside = positionOnRectangle(
          clientX,
          clientY,
          boundingBox.x1 - 5,
          boundingBox.y1 - 5,
          boundingBox.x2 !== undefined
            ? boundingBox.x2 + 10
            : boundingBox.x1 + 10,
          boundingBox.y2 !== undefined
            ? boundingBox.y2 + 10
            : boundingBox.y1 + 10
        );

        if (!isInside) {
          setSelectedElement(null);
          setAction("selecting");
        } else if (isInside === "inside") {
          const offsetX: number[] = [];
          const offsetY: number[] = [];

          if (
            selectedElement.type === "freehand" &&
            (selectedElement as FreehandElement).stroke
          ) {
            const freehandElement = selectedElement as FreehandElement;
            for (let i = 0; i < freehandElement.stroke.length; i++) {
              offsetX.push(clientX - freehandElement.stroke[i][0]);
              offsetY.push(clientY - freehandElement.stroke[i][1]);
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
      return;
    }

    // Text tool
    if (tool === "text") {
      setAction("writing");

      const newElement: TextElement = {
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
      return;
    }

    // Drawing tools (freehand, rectangle, line)
    if (tool === "freehand" || tool === "rectangle" || tool === "line") {
      setAction("drawing");
      setSelectedElement(null);

      if (tool === "rectangle" || tool === "line") {
        const newElement: RectangleElement | LineElement = {
          id: crypto.randomUUID(),
          x1: clientX,
          y1: clientY,
          x2: clientX,
          y2: clientY,
          type: tool,
          color,
          strokeWidth,
        };

        setElements([...elements, newElement]);
      } else if (tool === "freehand") {
        const newElement: FreehandElement = {
          id: crypto.randomUUID(),
          x1: 0,
          y1: 0,
          type: "freehand",
          stroke: [[clientX, clientY, event.pressure]],
          color,
          strokeWidth,
        };
        setElements([...elements, newElement]);
      }
    }
  };

  // Handler for pointer move events
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    // Handle moving elements
    if (action === "moving" && selectedElement) {
      const index = elements.findIndex(
        (element) => selectedElement.id === element.id
      );
      if (index === -1) return;

      const element = elements[index];
      const { offsetX, offsetY } = selectedElement;

      if (!offsetX || !offsetY) return;

      if (element.type === "freehand") {
        const freehandElement = element as FreehandElement;
        const newStrokes = updateEachStroke(
          freehandElement.stroke,
          clientX,
          clientY,
          offsetX,
          offsetY
        );

        if (!newStrokes) return;

        updateElement(index, {
          id: element.id,
          x1: 0,
          y1: 0,
          stroke: newStrokes,
        });

        setSelectedElement({
          ...selectedElement,
          x1: 0,
          y1: 0,
          stroke: [...newStrokes],
        });
      } else {
        // For rectangle, line, and text elements
        const x2 = element.x2 !== undefined ? element.x2 : element.x1;
        const y2 = element.y2 !== undefined ? element.y2 : element.y1;

        const width = x2 - element.x1;
        const height = y2 - element.y1;

        const newX1 = clientX - offsetX[0];
        const newY1 = clientY - offsetY[0];
        const newX2 = newX1 + width;
        const newY2 = newY1 + height;

        updateElement(index, {
          id: element.id,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });

        setSelectedElement({
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });
      }
      return;
    }

    // Handle drawing
    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      if (lastIndex < 0) return;

      const currentElement = elements[lastIndex];

      if (tool === "freehand") {
        const freehandElement = currentElement as FreehandElement;
        const newStroke = [
          ...(freehandElement.stroke || []),
          [clientX, clientY, event.pressure],
        ];

        updateElement(lastIndex, {
          id: currentElement.id,
          stroke: newStroke,
        });
      } else if (tool === "rectangle" || tool === "line") {
        updateElement(lastIndex, {
          id: currentElement.id,
          x2: clientX,
          y2: clientY,
        });
      }
      return;
    }

    // Handle resizing elements
    if (action === "resizing" && selectedElement) {
      if (selectedElement.type === "text") return;

      const index = elements.findIndex(
        (element) => selectedElement.id === element.id
      );

      if (index === -1) return;

      const { selectedPosition } = selectedElement;
      if (!selectedPosition) return;

      const boundingBox = getElementBoundingBox(selectedElement);
      const width =
        boundingBox.x2 !== undefined ? boundingBox.x2 - boundingBox.x1 : 0;
      const height =
        boundingBox.y2 !== undefined ? boundingBox.y2 - boundingBox.y1 : 0;

      let scaleX = 1,
        scaleY = 1;
      let newX1 = boundingBox.x1,
        newY1 = boundingBox.y1;
      let newX2 = boundingBox.x2 ?? boundingBox.x1;
      let newY2 = boundingBox.y2 ?? boundingBox.y1;
      let referenceX = boundingBox.x1,
        referenceY = boundingBox.y1;

      // Calculate new dimensions based on resize handle position
      switch (selectedPosition) {
        case "b":
          scaleY = height !== 0 ? (clientY - boundingBox.y1) / height : 1;
          referenceY = boundingBox.y1;
          newY2 = clientY;
          break;
        case "t":
          scaleY =
            height !== 0 ? ((boundingBox.y2 as number) - clientY) / height : 1;
          referenceY = boundingBox.y2 as number;
          newY1 = clientY;
          break;
        case "l":
          scaleX =
            width !== 0 ? ((boundingBox.x2 as number) - clientX) / width : 1;
          referenceX = boundingBox.x2 as number;
          newX1 = clientX;
          break;
        case "r":
          scaleX = width !== 0 ? (clientX - boundingBox.x1) / width : 1;
          referenceX = boundingBox.x1;
          newX2 = clientX;
          break;
        case "start":
        case "tl":
          scaleX =
            width !== 0 ? ((boundingBox.x2 as number) - clientX) / width : 1;
          scaleY =
            height !== 0 ? ((boundingBox.y2 as number) - clientY) / height : 1;
          referenceX = boundingBox.x2 as number;
          referenceY = boundingBox.y2 as number;
          newX1 = clientX;
          newY1 = clientY;
          break;
        case "tr":
          scaleX = width !== 0 ? (clientX - boundingBox.x1) / width : 1;
          scaleY =
            height !== 0 ? ((boundingBox.y2 as number) - clientY) / height : 1;
          referenceX = boundingBox.x1;
          referenceY = boundingBox.y2 as number;
          newX2 = clientX;
          newY1 = clientY;
          break;
        case "bl":
          scaleX =
            width !== 0 ? ((boundingBox.x2 as number) - clientX) / width : 1;
          scaleY = height !== 0 ? (clientY - boundingBox.y1) / height : 1;
          referenceX = boundingBox.x2 as number;
          referenceY = boundingBox.y1;
          newX1 = clientX;
          newY2 = clientY;
          break;
        case "end":
        case "br":
          scaleX = width !== 0 ? (clientX - boundingBox.x1) / width : 1;
          scaleY = height !== 0 ? (clientY - boundingBox.y1) / height : 1;
          referenceX = boundingBox.x1;
          referenceY = boundingBox.y1;
          newX2 = clientX;
          newY2 = clientY;
          break;
      }

      // Apply updates based on element type
      if (selectedElement.type === "freehand") {
        const freehandElement = selectedElement as FreehandElement;
        let updatedStrokes = [...freehandElement.stroke];

        // Scale each point in the stroke
        updatedStrokes = updatedStrokes.map(([px, py, pressure]) => [
          referenceX + (px - referenceX) * scaleX,
          referenceY + (py - referenceY) * scaleY,
          pressure,
        ]);

        updateElement(index, {
          id: selectedElement.id,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
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
      } else {
        updateElement(index, {
          id: selectedElement.id,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });

        setSelectedElement({
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });
      }
      return;
    }

    // Handle panning
    if (action === "panning") {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;
      setPanOffSet((prevState) => ({
        x: prevState.x + deltaX,
        y: prevState.y + deltaY,
      }));
      return;
    }

    // Handle erasing
    if (action === "erasing") {
      const element = getElementAtPosition(clientX, clientY, elements);

      if (element.id && element.selectedPosition) {
        const index = elements.findIndex(({ id }) => id === element.id);
        if (index !== -1) {
          const fullElement = elements[index];
          if (!eraseElements.some((e) => e.id === element.id)) {
            setEraseElements([...eraseElements, fullElement]);
            updateElement(index, {
              ...fullElement,
              opacity: 0.5,
              id: fullElement.id,
            });
          }
        }
      }
    }
  };

  // Handler for pointer up events
  const handlePointerUp = () => {
    // Handle erasing
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

    // Skip for writing action
    if (action === "writing") {
      return;
    }

    // Finalize drawing
    if (action === "drawing") {
      const lastIndex = elements.length - 1;
      if (lastIndex < 0) return;

      const element = elements[lastIndex];

      if (element.type === "rectangle" || element.type === "line") {
        const { x1, y1, x2, y2 } = element;

        if (x2 === undefined || y2 === undefined) return;

        const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
          element.type as Shapes,
          x1,
          y1,
          x2,
          y2
        );

        updateElement(lastIndex, {
          id: element.id,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });
      }
    }

    // Reset action state
    setAction("none");
  };

  // Handle text input blur (finalize text element)
  const handleBlur = () => {
    if (
      !selectedElement ||
      selectedElement.type !== "text" ||
      !textElementRef.current
    )
      return;

    const ctx = boardRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.font = `${fontSize}px ${fontFamily}`;

    const text = textElementRef.current.value || "";
    const metrics = ctx.measureText(text);
    const height = fontSize;

    const updatedElement: TextElement = {
      ...selectedElement,
      text,
      x2: selectedElement.x1 + metrics.width,
      y2: selectedElement.y1 + height,
    };

    setElements([...elements, updatedElement]);
    ctx.restore();

    setSelectedElement(null);
    setTool("select");
    setAction("selecting");
  };

  // Handle zoom operations
  const onZoom = (delta: number) => {
    if (delta === 0) {
      setScale(1);
      return;
    }
    setScale((prevState) => Math.min(Math.max(prevState + delta, 0.1), 2));
  };

  // Get appropriate cursor based on current tool and action
  const getCursorForTool = (): string => {
    if (action === "moving") return "move";
    if (action === "resizing") return "nwse-resize";
    if (action === "panning") return "grabbing";
    return TOOLS[tool]?.cursor || "default";
  };

  return (
    <div
      onPointerUp={handlePointerUp}
      className="relative z-0"
    >
      {/* Toolbar */}
      <div
        className="fixed flex top-4 left-1/2 -translate-x-1/2 items-center gap-2"
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <ToolBar />
        <DarkModeButton />
      </div>

      {/* Undo/Redo Controls */}
      <div
        className="fixed bottom-5 left-6 rounded-md shadow-lg"
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <UndoRedo
          darkMode={darkMode}
          undo={undo}
          redo={redo}
        />
      </div>

      {/* Zoom Controls */}
      <div
        className="fixed bottom-5 right-6 rounded-md shadow-lg"
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <ZoomButtons
          darkMode={darkMode}
          scale={scale}
          onZoom={onZoom}
        />
      </div>

      {/* Menu */}
      <div
        className={`fixed top-28 left-5 p-4 rounded-md shadow-lg ${
          darkMode ? "bg-[#232329] text-white" : "bg-white text-black "
        }`}
        style={{
          cursor: action === "drawing" ? "not-allowed" : "default",
          pointerEvents: action === "drawing" ? "none" : "auto",
        }}
      >
        <Menu darkMode={darkMode} />
      </div>

      {/* Text input area */}
      {action === "writing" && selectedElement && (
        <textarea
          onBlur={handleBlur}
          ref={textElementRef}
          className="fixed focus:outline-none resize-none"
          style={{
            top:
              selectedElement.y1 * scale +
              panOffset.y * scale -
              scaleOffset.y -
              10 * scale,
            left:
              selectedElement.x1 * scale + panOffset.x * scale - scaleOffset.x,
            fontFamily: fontFamily,
            color: color,
            fontSize: fontSize * scale,
            transformOrigin: "top left",
          }}
        />
      )}

      {/* Canvas */}
      <canvas
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className={`${darkMode ? "bg-black" : "bg-white"} -z-10`}
        style={{ cursor: getCursorForTool() }}
      />
    </div>
  );
}

// Tools configuration
const TOOLS: Record<TOOL, { cursor: string }> = {
  rectangle: { cursor: "crosshair" },
  line: { cursor: "crosshair" },
  move: { cursor: "move" },
  select: { cursor: "default" },
  freehand: { cursor: "crosshair" },
  text: { cursor: "text" },
  pan: { cursor: "grab" },
  eraser: {
    cursor: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAANlJREFUOE9jZKAyYKSyeQzDw0AfBgYGPWjQXGJgYNiCL5jwedmHj49vtrq6OoejoyMvyJD9+/d/vnnz5o9Pnz6l4jIYl4E+7Ozsa1evXs3m6+uL4qDNmzczhIaG/vr582cwNkOxGsjHx/d8yZIlEuiGwUwGGRoTE/Pi06dPkujex2agj6mp6eJTp04J4AsrMzOzD6dPn45FdyU2A6vKysqaOjs7mfEZWF5e/rerq6uOgYGhDVkdXQykupcZqB0poCChbrKBBjJVEzZyxFEt65FVsg2P4oskrwMAC4ZwFWmZPgcAAAAASUVORK5CYII="), auto`,
  },
};
