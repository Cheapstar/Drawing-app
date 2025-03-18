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
  SelectedPosition,
  BoundingElement,
} from "@/types/types";
import { HistoryState, useHistory } from "./utils/history";
import {
  point,
  positionOnRectangle,
  getElementAtPosition,
  nearPoint,
  quadraticBezierMidpoint,
  getNewControlPoints,
  getPositionOnBoundingBox,
} from "./utils/position";
import {
  adjustElementCoordinates,
  drawAnchorPoints,
  drawCurveBoundingBox,
  drawHandle,
  getElementBoundingBox,
  getTheBoundingBox,
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

type CursorAction =
  | "vertical"
  | "horizontal"
  | "acute"
  | "obtuse"
  | "inside"
  | "none";

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

  const [boundingElement, setBoundingElement] = useState<BoundingElement>();
  const [cursorAction, setCursorAction] = useState<CursorAction>();

  const boardRef = useRef<HTMLCanvasElement>(null);
  const textElementRef = useRef<HTMLTextAreaElement>(null);

  const [drawingElement, setDrawingElement] = useState<Element | null>(null);

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

    if (drawingElement) {
      drawElement(rc, ctx, drawingElement);
    }

    // Draw all elements
    elements.forEach((element: Element) => {
      if (selectedElement && element.id === selectedElement.id) {
        drawElement(rc, ctx, selectedElement);
        return;
      }
      drawElement(rc, ctx, element);
    });

    // Draw selection indicator
    if (boundingElement && selectedElement) {
      const { x1, y1, width, height, type } = boundingElement;

      ctx.save();

      if (type === "line") {
        const line = selectedElement as LineElement;
        drawAnchorPoints(ctx, line, scale);
        if (line.isCurved) {
          drawCurveBoundingBox(ctx, line, scale);
        }
      } else {
        ctx.lineWidth = getLineWidth(scale);
        ctx.strokeStyle = "#6965db";
        ctx.strokeRect(x1, y1, width, height);

        // Draw control points
        ctx.fillStyle = "white";

        // Corner handles
        drawHandle(ctx, x1, y1);
        drawHandle(ctx, x1 + width, y1);
        drawHandle(ctx, x1, y1 + height);
        drawHandle(ctx, x1 + width, y1 + height);
      }
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
    boundingElement,
  ]);

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

  function getTheOffsets(elementAtPosition: Element, client: Point) {
    const offsetX = [];
    const offsetY = [];

    switch (elementAtPosition.type) {
      case "rectangle":
      case "line":
      case "text":
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

  // Handler for pointer down events
  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const { x: clientX, y: clientY } = getMouseCoordinates(event);

    if (action === "writing") return;

    // Eraser tool
    if (tool === "eraser") {
      setSelectedElement(null);
      const element = getElementAtPosition(clientX, clientY, elements);
      console.log("Erased Element", element);

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
      // get the element with its selected Position
      // First Let's go with Line
      const elementAtPosition = getElementAtPosition(
        clientX,
        clientY,
        elements,
        scale
      );

      if (!elementAtPosition) return;

      // Here Hame dekhna hai Agar Element Selected hai and Agar Nahi Hai
      // Based on that we will proceed in different Direction

      // When click is on the selected Ekement
      if (selectedElement && elementAtPosition.id === selectedElement.id) {
        // If Program reaches this block this does tell us that cursor is on the selectedElement

        // Check the Element Type
        if (selectedElement.type === "line") {
          // We Need To check is it on the corners or on the middle or else where

          const midX = (selectedElement.x1 + selectedElement.x2) / 2;
          const midY = (selectedElement.y1 + selectedElement.y2) / 2;

          //check corners
          const onStart = nearPoint(
            boundingElement.x1,
            boundingElement.y1,
            clientX,
            clientY
          )
            ? "start"
            : null;

          const onEnd = nearPoint(
            boundingElement.x2,
            boundingElement.y2,
            clientX,
            clientY
          )
            ? "end"
            : null;

          const midPoints = quadraticBezierMidpoint(selectedElement);
          const onMiddle = nearPoint(midPoints.x, midPoints.y, clientX, clientY)
            ? "middle"
            : null;

          // Only one of them will be true
          const result = onStart || onEnd || onMiddle;

          if (result) {
            setSelectedElement({
              ...selectedElement,
              isSelected: true,
              selectedPosition: result as SelectedPosition,
            });

            setAction("resizing");
          } else {
            // We Need Offsets to determine where the use has clicked to determine the
            // moving position
            let offset: {
              x: number[];
              y: number[];
            } = { x: [], y: [] };

            offset = getTheOffsets(selectedElement, point(clientX, clientY));

            setSelectedElement({
              ...(selectedElement as Element),
              isSelected: true,
              offsetX: offset.x,
              offsetY: offset.y,
              selectedPosition: "on" as SelectedPosition,
            });

            setAction("moving");
          }

          return;
        }
      } else if (selectedElement) {
        // check if it is inside the bounding zone
        // This runs when click is on the bounding box not on the selectedElement

        const boundingBox = getTheBoundingBox(selectedElement, scale);
        const posOnBoundingBox = getPositionOnBoundingBox(
          boundingBox as BoundingElement,
          point(clientX, clientY)
        );

        // if client is on Bounding Box then we need to do something
        console.log("Position inside bounding box is", posOnBoundingBox);
        // Based on its position
        if (posOnBoundingBox) {
          if (posOnBoundingBox === "inside") {
            // get the offset for moving
            const offset = getTheOffsets(
              selectedElement,
              point(clientX, clientY)
            );
            setBoundingElement({
              ...boundingBox,
              selectedPosition: posOnBoundingBox,
              offsetX: offset.x,
              offsetY: offset.y,
              isSelected: true,
            } as BoundingElement);

            setSelectedElement({
              ...selectedElement,
              isSelected: false,
            });
            setAction("moving");
            return;
          } else {
            setBoundingElement({
              ...boundingBox,
              selectedPosition: posOnBoundingBox,
            } as BoundingElement);
            setAction("resizing");
            return;
          }
        }
      }

      if (elementAtPosition.type === "line") {
        console.log("Selected Line Element is ", elementAtPosition);
        setSelectedElement({
          ...elementAtPosition,
          isSelected: true,
        } as Element);
        setBoundingElement({
          ...elementAtPosition,
          isSelected: false,
        } as BoundingElement);
        return;
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
      if (tool === "line") {
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

        return;
      }

      setAction("drawing");
      setSelectedElement(null);

      if (tool === "rectangle") {
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
          x1: clientX,
          y1: clientY,
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
    let { x: clientX, y: clientY } = getMouseCoordinates(event);

    // Handle moving elements
    if (action === "moving" && selectedElement && boundingElement) {
      console.log("Action is equal to moving");

      // All for line
      if (selectedElement.type === "line" && selectedElement.isSelected) {
        const { x1, y1, x2, y2, offsetX, offsetY, controlPoint } =
          selectedElement as LineElement;

        const width = x2 - x1;
        const height = y2 - y1;
        const newX1 = clientX - (offsetX as number[])[0];
        const newY1 = clientY - (offsetY as number[])[0];
        const newX2 = newX1 + width;
        const newY2 = newY1 + height;
        const newControlPoint = {
          x: controlPoint.x + newX1 - x1,
          y: controlPoint.y + newY1 - y1,
        };

        setSelectedElement({
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
          controlPoint: newControlPoint,
        });
        setBoundingElement({
          ...boundingElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });

        return;
      } else if (
        boundingElement.type === "line" &&
        boundingElement.isSelected
      ) {
        const { x1, y1, x2, y2, controlPoint } = selectedElement as LineElement;
        const { offsetX, offsetY } = boundingElement;

        const width = x2 - x1;
        const height = y2 - y1;
        const newX1 = clientX - (offsetX as number[])[0];
        const newY1 = clientY - (offsetY as number[])[0];
        const newX2 = newX1 + width;
        const newY2 = newY1 + height;
        const newControlPoint = {
          x: controlPoint.x + newX1 - x1,
          y: controlPoint.y + newY1 - y1,
        };

        setSelectedElement({
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
          controlPoint: newControlPoint,
        });
        setBoundingElement({
          ...boundingElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });
      }
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
      }

      const lastIndex = elements.length - 1;
      if (lastIndex < 0) return;

      const currentElement = elements[lastIndex];

      if (tool === "freehand") {
        const freehandElement = currentElement as FreehandElement;
        const newStroke = [
          ...(freehandElement.stroke || []),
          [clientX, clientY, event.pressure],
        ];

        console.log("Current Element is", freehandElement);
        updateElement(lastIndex, {
          ...currentElement,
          id: currentElement.id,
          stroke: newStroke,
        });
      } else if (tool === "rectangle") {
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

      if (selectedElement.type === "line" && selectedElement.isSelected) {
        // console.log("Line is resizing");

        if (selectedElement?.selectedPosition === "start") {
          // Here we need to update the x1,y1

          setSelectedElement({
            ...selectedElement,
            x1: clientX,
            y1: clientY,
            controlPoint: {
              x: selectedElement.isCurved
                ? (selectedElement.controlPoint as Point).x
                : (selectedElement.x1 + selectedElement.x2) / 2,
              y: selectedElement.isCurved
                ? (selectedElement.controlPoint as Point).y
                : (selectedElement.y1 + selectedElement.y2) / 2,
            },
          });

          setBoundingElement({
            ...boundingElement,
            x1: clientX,
            y1: clientY,
          });
        } else if (selectedElement?.selectedPosition === "end") {
          // Here we need to update the x1,y1
          setSelectedElement({
            ...selectedElement,
            x2: clientX,
            y2: clientY,
            controlPoint: {
              x: selectedElement.isCurved
                ? (selectedElement.controlPoint as Point).x
                : (selectedElement.x1 + selectedElement.x2) / 2,
              y: selectedElement.isCurved
                ? (selectedElement.controlPoint as Point).y
                : (selectedElement.y1 + selectedElement.y2) / 2,
            },
          });

          setBoundingElement({
            ...(boundingElement as BoundingElement),
            x2: clientX,
            y2: clientY,
          });
        } else {
          console.log("SelectedPosition is", boundingElement?.selectedPosition);
          const newControlPoints = getNewControlPoints(
            selectedElement,
            point(clientX, clientY)
          );
          setSelectedElement({
            ...selectedElement,
            controlPoint: newControlPoints,
            isCurved: true,
          });

          setBoundingElement({
            ...(boundingElement as BoundingElement),
          });
        }

        return;
      }

      const index = elements.findIndex(
        (element) => selectedElement.id === element.id
      );

      // Safety Check
      if (index === -1) return;

      const { selectedPosition } = selectedElement;
      if (!selectedPosition) return;

      // First get proper bounding box from the helper function
      const originalBoundingBox = selectedElement;

      console.log("Selected Element is V5", selectedElement);

      const { height: Bheight, width: Bwidth } = getElementBoundingBox(
        { ...selectedElement },
        scale
      );
      // Then normalize it correctly
      const padding = 15 * scale;
      const boundingBox = {
        x1: originalBoundingBox.x1,
        y1: originalBoundingBox.y1,
        x2:
          selectedElement.type != "freehand"
            ? originalBoundingBox.x2
            : originalBoundingBox.x1 + Bwidth - 2 * padding,
        y2:
          selectedElement.type != "freehand"
            ? originalBoundingBox.y2
            : originalBoundingBox.y1 + Bheight - 2 * padding,
        width: Bwidth - 2 * padding,
        height: Bheight - 2 * padding,
      };

      // Fixed issue: Initialize newX1, newY1, newX2, newY2 with original box values
      let newX1 = boundingBox.x1;
      let newY1 = boundingBox.y1;
      let newX2 = boundingBox.x2;
      let newY2 = boundingBox.y2;

      // Initialize scaling and reference points
      let scaleX = 1,
        scaleY = 1;
      let referenceX = boundingBox.x1,
        referenceY = boundingBox.y1;
      const width = boundingBox.width;
      const height = boundingBox.height;

      console.log("BoundingBox is ", referenceX, referenceY);

      // Calculate new dimensions based on resize handle position
      switch (selectedPosition) {
        case "b":
          newY2 = clientY - padding;
          scaleY = height !== 0 ? (newY2 - boundingBox.y1) / height : 1;
          referenceY = boundingBox.y1;
          break;
        case "t":
          newY1 = clientY + padding;
          scaleY = height !== 0 ? (boundingBox.y2 - newY1) / height : 1;
          referenceY = boundingBox.y2;
          break;
        case "l":
          newX1 = clientX + padding;
          scaleX = width !== 0 ? (boundingBox.x2 - newX1) / width : 1;
          referenceX = boundingBox.x2;
          break;
        case "r":
          newX2 = clientX - padding;
          scaleX = width !== 0 ? (newX2 - boundingBox.x1) / width : 1;
          referenceX = boundingBox.x1;
          break;
        case "start":
        case "tl":
          newX1 = clientX + padding;
          newY1 = clientY + padding;
          scaleX = width !== 0 ? (boundingBox.x2 - newX1) / width : 1;
          scaleY = height !== 0 ? (boundingBox.y2 - newY1) / height : 1;
          referenceX = boundingBox.x2;
          referenceY = boundingBox.y2;
          break;
        case "tr":
          newX2 = clientX - padding;
          newY1 = clientY + padding;
          scaleX = width !== 0 ? (newX2 - boundingBox.x1) / width : 1;
          scaleY = height !== 0 ? (boundingBox.y2 - newY1) / height : 1;
          referenceX = boundingBox.x1;
          referenceY = boundingBox.y2;
          break;
        case "bl":
          newX1 = clientX + padding;
          newY2 = clientY - padding;
          scaleX = width !== 0 ? (boundingBox.x2 - newX1) / width : 1;
          scaleY = height !== 0 ? (newY2 - boundingBox.y1) / height : 1;
          referenceX = boundingBox.x2;
          referenceY = boundingBox.y1;
          break;
        case "end":
        case "br":
          newX2 = clientX - padding;
          newY2 = clientY - padding;
          scaleX = width !== 0 ? (newX2 - boundingBox.x1) / width : 1;
          scaleY = height !== 0 ? (newY2 - boundingBox.y1) / height : 1;
          referenceX = boundingBox.x1;
          referenceY = boundingBox.y1;
          break;
      }

      // Apply updates based on element type
      if (selectedElement.type === "freehand") {
        const freehandElement = selectedElement as FreehandElement;

        // Scale each point in the stroke relative to the reference point
        const updatedStrokes = freehandElement.stroke.map(
          ([px, py, pressure]) => [
            referenceX + (px - referenceX) * scaleX,
            referenceY + (py - referenceY) * scaleY,
            pressure,
          ]
        );

        // Update the element with new values
        const updatedElement = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
          stroke: updatedStrokes,
        };

        setSelectedElement(updatedElement);
        setBoundingElement(getElementBoundingBox(updatedElement, scale));
      } else {
        // For non-freehand elements
        const updatedElement = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        };

        setSelectedElement(updatedElement);
        setBoundingElement({
          x1: newX1 - padding,
          y1: newY1 - padding,
          x2: newX2 + padding,
          y2: newY2 + padding,
          width: newX2 - newX1 + 2 * padding,
          height: newY2 - newY1 + 2 * padding,
        });
      }
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

    // cursor
    // if (selectedElement && boundingElement) {
    //   const positionOnElement = positionOnRectangle(
    //     clientX,
    //     clientY,
    //     boundingElement.x1,
    //     boundingElement.y1,
    //     boundingElement.x2,
    //     boundingElement.y2
    //   );

    //   switch (positionOnElement) {
    //     case "b":
    //     case "t":
    //       setCursorAction("vertical");
    //       break;
    //     case "l":
    //     case "r":
    //       setCursorAction("horizontal");
    //       break;
    //     case "bl":
    //     case "tr":
    //       setCursorAction("acute");
    //       break;
    //     case "br":
    //     case "tl":
    //       setCursorAction("obtuse");
    //       break;
    //     case "inside":
    //       setCursorAction("inside");
    //       break;

    //     default:
    //       setCursorAction("none");
    //       break;
    //   }
    // }
  };

  // Handler for pointer up events
  // Fix for the handlePointerUp function
  const handlePointerUp = () => {
    // Handle erasing
    if (action === "erasing") {
      if (eraseElements.length === 0) {
        setAction("none");
        return;
      }

      const newElements = elements.filter(
        (element) =>
          !eraseElements.some((eraseElement) => eraseElement.id === element.id)
      );

      setElements(newElements);
      setEraseElements([]);
      setSelectedElement(null);
      setAction("none");
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
          type as Shapes,
          x1,
          y1,
          x2,
          y2
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
                x: (newX1 + newX2) / 2,
                y: (newY1 + newY2) / 2,
              },
            },
          },
        ] as HistoryState);
        setAction("none");
        setDrawingElement(null);
        return;
      }

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
      setAction("none");
      return;
    }

    // Handle resizing
    if ((action === "resizing" || action === "moving") && selectedElement) {
      const index = elements.findIndex(
        (element) => element.id === selectedElement.id
      );

      if (index !== -1) {
        // Create a copy of the elements array
        const updatedElements = [...elements];

        const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
          selectedElement.type as Shapes,
          selectedElement.x1,
          selectedElement.y1,
          selectedElement.x2 as number,
          selectedElement.y2 as number
        );
        // Replace the element at the index with the selectedElement
        updatedElements[index] = {
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        };
        setSelectedElement({
          ...selectedElement,
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });

        setBoundingElement({
          ...(boundingElement as BoundingElement),
          x1: newX1,
          y1: newY1,
          x2: newX2,
          y2: newY2,
        });
        // Update the elements state
        setElements(updatedElements);
      }
      setAction("none");
      return;
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

  return (
    <div
      onPointerUp={handlePointerUp}
      className="relative z-0"
    >
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
      <div
        className={`fixed top-28 left-5 p-4 rounded-md shadow-lg ${
          darkMode ? "bg-[#232329] text-white" : "bg-white text-black "
        }`}
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
const TOOLS: Record<TOOL | string, { cursor: string }> = {
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
