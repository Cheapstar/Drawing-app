/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Element,
  Action,
  Point,
  FreehandElement,
  RectangleElement,
  LineElement,
  TextElement,
} from "@/types/types";
import { HistoryState, useHistory } from "./utils/history";
import { point } from "@/Geometry/utils";
import { adjustElementCoordinates } from "@/Geometry/utils";
import { drawElement } from "@/Geometry/elements/draw";

import { handleElementSelection } from "@/Geometry/elements/selection";
import { drawBoundingBox } from "@/Geometry/elements/draw";
import {
  finalizeResizeAndMoving,
  handleElementResize,
} from "@/Geometry/elements/resize";
import { handleElementMove } from "@/Geometry/elements/move";
import {
  finalizeErasing,
  handleEraser,
  handleEraserMove,
} from "@/Geometry/elements/eraser";

import { TOOLS } from "@/Constants";
import { useZoom } from "./utils/useZoom";
import { usePan } from "./utils/usePan";
import { getTextElementDetails } from "@/Geometry/text/boundingElement";
import { deleteElement } from "@/Geometry/elements/deleteElement";
import { ImSpinner, ImSpinner2 } from "react-icons/im";
import { SideMenu } from "./SideMenu";
import { checkOnText } from "@/Geometry/text/position";

type CursorAction =
  | "vertical"
  | "horizontal"
  | "acute"
  | "obtuse"
  | "inside"
  | "none";

export function WhiteBoard() {
  const { elements, setElements, undo, redo, loadingSavedElements } =
    useHistory([]);
  const [tool, setTool] = useAtom(toolAtom);
  const [action, setAction] = useState<Action>("none");
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const {
    panOffset,
    setPanOffSet,
    startPanMousePosition,
    setStartPanMousePosition,
  } = usePan();

  const [eraseElements, setEraseElements] = useState<Element[]>([]);
  const [color] = useAtom(colorAtom);
  const [strokeWidth] = useAtom(strokeWidthAtom);
  const [fontSize] = useAtom(fontSizeAtom);
  const [fontFamily] = useAtom(fontFamilyAtom);
  const [darkMode] = useAtom(darkModeAtom);

  const [cursorAction, setCursorAction] = useState<CursorAction>();

  const boardRef = useRef<HTMLCanvasElement>(null);
  const textElementRef = useRef<HTMLDivElement>(null);
  const updatingElementRef = useRef<HTMLDivElement>(null);

  const { scale, scaleOffset, setScaleOffset, onZoom } = useZoom();
  const [drawingElement, setDrawingElement] = useState<Element | null>(null);

  const [updatingElement, setUpdatingElement] = useState<Element | null>();
  const [updating, setUpdating] = useState<boolean>(false);

  // Focus textarea when writing text
  useEffect(() => {
    if (action === "writing" && textElementRef.current) {
      setTimeout(() => {
        if (textElementRef.current) {
          textElementRef.current.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(textElementRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 10);
    }
  }, [action]);

  useEffect(() => {
    if (updatingElement && updating) {
      setTimeout(() => {
        if (updatingElementRef.current) {
          const { text } = updatingElement as TextElement;

          const lines = text?.split("\n") as string[];
          console.log("Text is", updatingElement);

          for (const line of lines) {
            const lineContainer = document.createElement("div");
            lineContainer.innerText = line;
            updatingElementRef.current.appendChild(lineContainer);
          }

          updatingElementRef.current.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(updatingElementRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
          setUpdating(false);
        }
      }, 10);
    }
  }, [updatingElement, updatingElementRef, updating]);

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

  // Add a separate effect to update scaleOffset only when scale or canvas size changes
  useEffect(() => {
    const canvas = boardRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const scaledWidth = (canvas.width * scale) / dpr;
    const scaledHeight = (canvas.height * scale) / dpr;

    const scaleOffsetX = (scaledWidth - canvas.width / dpr) / 2;
    const scaleOffsetY = (scaledHeight - canvas.height / dpr) / 2;

    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });
  }, [scale, boardRef.current?.width, boardRef.current?.height]);

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

    // Calculate scale offset but don't set state here
    const scaleOffsetX = (scaledWidth - canvas.width / dpr) / 2;
    const scaleOffsetY = (scaledHeight - canvas.height / dpr) / 2;

    // Use the calculated values directly instead of from state
    ctx.save();

    // Scale for high DPR displays first
    ctx.scale(dpr, dpr);

    ctx.translate(
      panOffset.x * scale - scaleOffsetX,
      panOffset.y * scale - scaleOffsetY
    );
    ctx.scale(scale, scale);

    if (drawingElement && drawingElement.type != "text") {
      drawElement(rc, ctx, drawingElement);
    }

    if (updatingElement) {
      drawElement(rc, ctx, updatingElement);
    }

    // Draw all elements
    elements.forEach((element: Element) => {
      if (selectedElement && element.id === selectedElement.id) {
        drawElement(rc, ctx, selectedElement);
        return;
      }

      if (updatingElement && updatingElement.id === element.id) return;
      drawElement(rc, ctx, element);
    });

    // Draw selection indicator
    if (selectedElement) {
      ctx.save();

      drawBoundingBox(ctx, selectedElement, scale);
      ctx.restore();
    }

    ctx.restore();
  }, [
    elements,
    selectedElement,
    panOffset,
    scale,
    action,
    drawingElement,
    resizeCanvas,
    updatingElement,
  ]);

  function getLineWidth(scale: number) {
    if (scale >= 1) return 1.5;
    return 1.5 + (Math.abs(1 - scale) * 5 - Math.abs(scale));
  }

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

  const createTextElement = (clientX: number, clientY: number) => {
    const newElement: TextElement = {
      type: "text",
      id: crypto.randomUUID(),
      x1: clientX,
      y1: clientY,
      text: "",
      color,
      fontSize,
      fontFamily,
      breaks: [],
      x2: clientX,
      y2: clientY,
      height: 0,
      width: 0,
    };

    setDrawingElement(newElement);
    setSelectedElement(null);
    setAction("writing");
  };

  const createLineElement = (clientX: number, clientY: number) => {
    const newElement: LineElement = {
      id: crypto.randomUUID(),
      x1: clientX,
      y1: clientY,
      x2: clientX,
      y2: clientY,
      type: "line",
      color,
      strokeWidth,
      isCurved: false,
    };

    setDrawingElement(newElement);
    setAction("drawing");
    setSelectedElement(null);
  };

  const createRectangleElement = (clientX: number, clientY: number) => {
    const newElement: RectangleElement = {
      id: crypto.randomUUID(),
      x1: clientX,
      y1: clientY,
      x2: clientX,
      y2: clientY,
      type: "rectangle",
      color,
      strokeWidth,
    };

    setDrawingElement(newElement);
    setAction("drawing");
    setSelectedElement(null);
  };

  const createFreehandElement = (
    clientX: number,
    clientY: number,
    pressure: number
  ) => {
    const newElement: FreehandElement = {
      id: crypto.randomUUID(),
      x1: clientX,
      y1: clientY,
      type: "freehand",
      stroke: [[clientX, clientY, pressure]],
      originalStroke: [[clientX, clientY, pressure]],
      color,
      strokeWidth,
    };

    setDrawingElement(newElement);
    setAction("drawing");
    setSelectedElement(null);
  };

  // Handler for pointer down events
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    if (action === "writing") return;

    // Eraser tool
    if (tool === "eraser") {
      handleEraser(
        point(clientX, clientY),
        selectedElement as Element,
        elements,
        eraseElements,
        setSelectedElement,
        setEraseElements,
        setAction,
        updateElement,
        scale,
        boardRef as React.RefObject<HTMLCanvasElement>
      );
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
      handleElementSelection(
        point(clientX, clientY),
        selectedElement as Element,
        elements,
        setSelectedElement,
        setAction,
        scale,
        boardRef as React.RefObject<HTMLCanvasElement>
      );

      return;
    }
    // Text tool
    if (tool === "text") {
      createTextElement(clientX, clientY);
      return;
    }

    // Drawing tools
    if (tool === "line") {
      createLineElement(clientX, clientY);
      return;
    } else if (tool === "rectangle") {
      createRectangleElement(clientX, clientY);
      return;
    } else if (tool === "freehand") {
      createFreehandElement(clientX, clientY, event.pressure);
      return;
    }
  };

  // Handler for pointer move events
  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    // Handle moving elements
    if (action === "moving" && selectedElement) {
      handleElementMove(
        point(clientX, clientY),
        selectedElement,
        setSelectedElement
      );
      return;
    }

    // Handle drawing
    if (action === "drawing") {
      if (tool === "line") {
        setDrawingElement({
          ...(drawingElement as LineElement),
          x2: clientX,
          y2: clientY,
        });
        return;
      } else if (tool === "rectangle") {
        setDrawingElement({
          ...(drawingElement as RectangleElement),
          x2: clientX,
          y2: clientY,
        });
        return;
      } else if (tool === "freehand") {
        const freehandElement = drawingElement as FreehandElement;
        const newStroke = [
          ...(freehandElement.stroke || []),
          [clientX, clientY, event.pressure],
        ];

        setDrawingElement({
          ...drawingElement,
          stroke: newStroke,
          originalStroke: newStroke,
        } as FreehandElement);
        return;
      }
    }

    // Handle resizing elements
    if (action === "resizing" && selectedElement) {
      handleElementResize(
        point(clientX, clientY),
        selectedElement,
        setSelectedElement
      );
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
      handleEraserMove(
        point(clientX, clientY),
        elements,
        eraseElements,
        setEraseElements,
        updateElement,
        scale,
        boardRef as React.RefObject<HTMLCanvasElement>
      );
      return;
    }
  };

  // Handler for pointer up events
  // Fix for the handlePointerUp function
  const handlePointerUp = () => {
    // Handle erasing
    if (action === "erasing") {
      finalizeErasing(
        elements,
        eraseElements,
        setSelectedElement,
        setEraseElements,
        setAction,
        setElements
      );
      return;
    }

    // Skip for writing action
    if (action === "writing") {
      return;
    }

    // Finalize drawing
    if (action === "drawing") {
      if (tool === "line") {
        const { x1, y1, x2, y2, type } = drawingElement as LineElement;
        const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
          drawingElement as Element
        );

        setElements([
          ...elements,
          {
            ...drawingElement,
            ...{
              x1: newX1,
              y1: newY1,
              x2: newX2,
              y2: newY2,
              controlPoint: {
                x: ((newX1 as number) + (newX2 as number)) / 2,
                y: ((newY1 as number) + (newY2 as number)) / 2,
              },
            },
          },
        ] as HistoryState);
        setAction("none");
        setDrawingElement(null);
        return;
      } else if (tool === "rectangle") {
        const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
          drawingElement as RectangleElement
        );

        setElements([
          ...elements,
          {
            ...drawingElement,
            ...{
              x1: newX1,
              y1: newY1,
              x2: newX2,
              y2: newY2,
            },
          },
        ] as HistoryState);
        setAction("none");
        setDrawingElement(null);
        return;
      } else if (tool === "freehand") {
        const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
          drawingElement as FreehandElement
        );

        setElements([
          ...elements,
          {
            ...drawingElement,
            ...{
              x1: newX1,
              y1: newY1,
              x2: newX2,
              y2: newY2,
            },
          },
        ] as HistoryState);
        setAction("none");
        setDrawingElement(null);
      }
      setAction("none");
      return;
    }

    // Handle resizing
    if ((action === "resizing" || action === "moving") && selectedElement) {
      finalizeResizeAndMoving(
        selectedElement,
        elements,
        setSelectedElement,
        setAction,
        setElements
      );
      return;
    }

    // Reset action state
    setAction("none");
  };

  // Handle text input blur (finalize text element)
  const handleDrawingTextBlur = () => {
    if (
      !drawingElement ||
      drawingElement.type !== "text" ||
      !textElementRef.current
    )
      return;

    if (drawingElement.text != "" && drawingElement.text != "\n") {
      const ctx = boardRef.current?.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.font = `${fontSize}px ${fontFamily}`;

      const text = drawingElement.text || "";

      const updatedElement: TextElement = {
        ...drawingElement,
        text,
        ...getTextElementDetails(drawingElement, ctx),
      };

      setElements([...elements, updatedElement]);

      ctx.restore();
    }

    setDrawingElement(null);
    setTool("select");
    setAction("selecting");
  };

  // Get appropriate cursor based on current tool and action
  const getCursorForTool = (): string => {
    if (cursorAction === "horizontal") return "ew-resize";
    if (cursorAction === "vertical") return "ns-resize";
    if (cursorAction === "acute") return "nesw-resize";
    if (cursorAction === "obtuse") return "nwse-resize";
    if (cursorAction === "inside") return "move";

    if (action === "moving") return "move";
    if (action === "resizing") return "nwse-resize";
    if (action === "panning") return "grabbing";
    return TOOLS[tool]?.cursor || "default";
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!selectedElement) return;
    if (updatingElement) return;

    console.log("Deleting the Element");

    if (event.key === "Delete" || event.key === "Backspace") {
      deleteElement(elements, selectedElement, setSelectedElement, setElements);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElement]);

  const handleUpdatingTextBlur = () => {
    if (
      !updatingElement ||
      updatingElement.type !== "text" ||
      !updatingElementRef.current
    )
      return;

    if (updatingElement.text === "" || updatingElement.text === "\n") {
      deleteElement(elements, updatingElement, setUpdatingElement, setElements);
    } else {
      const ctx = boardRef.current?.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.font = `${fontSize}px ${fontFamily}`;

      const text = updatingElement.text || "";

      const updatedElement: TextElement = {
        ...updatingElement,
        text,
        ...getTextElementDetails(updatingElement, ctx),
      };

      const newElements = [...elements];

      const index = newElements.findIndex((ele) => {
        return updatingElement.id === ele.id;
      });

      newElements[index] = updatedElement;

      setElements(newElements);

      ctx.restore();
      setUpdatingElement(null);
    }

    setTool("select");
    setAction("selecting");
  };

  const handleDoubleClick = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    // Check if the click is on the selected Element or not
    if (
      selectedElement &&
      selectedElement.type === "text" &&
      checkOnText(
        point(clientX, clientY),
        selectedElement,
        boardRef as React.RefObject<HTMLCanvasElement>
      )
    ) {
      setUpdatingElement(selectedElement);
      setUpdating(true);
      setSelectedElement(null);
      return;
    }

    // check is element selected
    if (tool === "select") {
      createTextElement(clientX, clientY);
      return;
    }
  };

  return (
    <div
      onPointerUp={handlePointerUp}
      className="relative z-0"
    >
      {/*Side Menu */}
      <div
        className="fixed flex top-3 left-3 items-center gap-2"
        style={{
          cursor:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "not-allowed"
              : "default",
          pointerEvents:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "none"
              : "auto",
        }}
      >
        <SideMenu></SideMenu>
      </div>

      {/* Toolbar */}
      <div
        className="fixed flex top-4 left-1/2 -translate-x-1/2 items-center gap-2"
        style={{
          cursor:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "not-allowed"
              : "default",
          pointerEvents:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "none"
              : "auto",
        }}
      >
        <ToolBar />
        <DarkModeButton />
      </div>

      {/* Undo/Redo Controls */}
      <div
        className="fixed bottom-5 left-6 rounded-md shadow-lg"
        style={{
          cursor:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "not-allowed"
              : "default",
          pointerEvents:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "none"
              : "auto",
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
          cursor:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "not-allowed"
              : "default",
          pointerEvents:
            action === "resizing" || action === "drawing" || action === "moving"
              ? "none"
              : "auto",
        }}
      >
        <ZoomButtons
          darkMode={darkMode}
          scale={scale}
          onZoom={onZoom}
        />
      </div>

      {/* Menu */}
      {(tool === "freehand" ||
        tool === "line" ||
        tool === "rectangle" ||
        tool === "text") && (
        <div
          className={`fixed top-28 left-5 p-4 rounded-md shadow-lg ${
            darkMode ? "bg-[#232329] text-white" : "bg-white text-black "
          }`}
          style={{
            cursor:
              action === "resizing" ||
              action === "drawing" ||
              action === "moving"
                ? "not-allowed"
                : "default",
            pointerEvents:
              action === "resizing" ||
              action === "drawing" ||
              action === "moving"
                ? "none"
                : "auto",
          }}
        >
          <Menu darkMode={darkMode} />
        </div>
      )}

      {/* Text input area */}
      {action === "writing" && drawingElement && (
        <div
          contentEditable
          onBlur={handleDrawingTextBlur}
          ref={textElementRef}
          className="fixed focus:outline-none z-[1000] h-auto w-auto"
          style={{
            top:
              drawingElement.y1 * scale +
              panOffset.y * scale -
              (scaleOffset?.y || 0) -
              10 * scale,
            left:
              drawingElement.x1 * scale +
              panOffset.x * scale -
              (scaleOffset?.x || 0),
            fontFamily: fontFamily,
            color: color,
            fontSize: fontSize * scale,
            transformOrigin: "top left",
          }}
          onInput={(event: React.FormEvent<HTMLDivElement>) => {
            if (drawingElement.type === "text") {
              setDrawingElement({
                ...drawingElement,
                text: event.currentTarget.innerText,
              });
            }
          }}
        ></div>
      )}

      {loadingSavedElements && (
        <div className="fixed inset-[50%] z-[10000]">
          <ImSpinner2 className="text-6xl text-gray-300 animate-spin duration-75"></ImSpinner2>
        </div>
      )}

      {/* Updating the Element */}
      {updatingElement && updatingElement.type === "text" && (
        <div
          contentEditable
          onBlur={handleUpdatingTextBlur}
          ref={updatingElementRef}
          className="fixed focus:outline-none z-[1000] h-auto w-auto"
          style={{
            top:
              updatingElement.y1 * scale +
              panOffset.y * scale -
              (scaleOffset?.y || 0) -
              10 * scale,
            left:
              updatingElement.x1 * scale +
              panOffset.x * scale -
              (scaleOffset?.x || 0),
            fontFamily: updatingElement.fontFamily,
            color: updatingElement.color,
            fontSize: (updatingElement.fontSize as number) * scale,
            transformOrigin: "top left",
          }}
          onInput={(event: React.FormEvent<HTMLDivElement>) => {
            if (updatingElement.type === "text") {
              console.log("The Text is", updatingElement.text);
              const sanitizedText = event.currentTarget.innerText.replace(
                /\n\n/g,
                "\n"
              );
              setUpdatingElement({
                ...updatingElement,
                text: sanitizedText,
              });
            }
          }}
          onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter") {
              if (updatingElement.type === "text") {
                const sanitizedText = event.currentTarget.innerText.replace(
                  /\n\n/g,
                  "\n"
                );

                setDrawingElement({
                  ...updatingElement,
                  text: sanitizedText + "\u00A0",
                });
              }
            }
          }}
        ></div>
      )}

      {/* Canvas */}
      <canvas
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onDoubleClick={handleDoubleClick}
        className={`${darkMode ? "bg-black" : "bg-white"} -z-10`}
        style={{ cursor: getCursorForTool() }}
      />
    </div>
  );
}
