/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { ToolBar } from "./ToolBar";
import { UndoRedo } from "./UndoRedo";
import { ZoomButtons } from "./ZoomButtons";
import {
  colorAtom,
  darkModeAtom,
  fontFamilyAtom,
  fontSizeAtom,
  showShareModalAtom,
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
  ImageElement,
} from "@/types/types";
import { HistoryState, useHistory } from "./hooks/history";
import { convertElement, convertElements, point } from "@/Geometry/utils";
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
import { useZoom } from "./hooks/useZoom";
import { usePan } from "./hooks/usePan";
import { getTextElementDetails } from "@/Geometry/text/boundingElement";
import { deleteElement } from "@/Geometry/elements/deleteElement";
import { ImSpinner, ImSpinner2 } from "react-icons/im";
import { SideMenu } from "./SideMenu";
import { checkOnText } from "@/Geometry/text/position";
import { ShareButton } from "./ShareButton";
import { ShareModal } from "./ShareModal";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { useSvg } from "./hooks/useSvg";
import { useIndexedDBImages } from "./hooks/useIndexedDBImages";
import { loadElementsFromStorage } from "@/storage";

type CursorAction =
  | "vertical"
  | "horizontal"
  | "acute"
  | "obtuse"
  | "inside"
  | "none";

export function WhiteBoard() {
  const { images, storeImage, getImage, db, deleteImage } =
    useIndexedDBImages();
  const {
    elements,
    setElements,
    undo,
    redo,
    loadingSavedElements,
    setLoadingSavedElements,
  } = useHistory({ initialState: [] });
  const [tool, setTool] = useAtom(toolAtom);
  const [action, setAction] = useState<Action>("none");
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const {
    panOffset,
    setPanOffset,
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

  const { scale, setScale, scaleOffset, setScaleOffset, onZoom } = useZoom({
    panOffset,
    setPanOffset,
  });
  const [drawingElement, setDrawingElement] = useState<Element | null>(null);

  const [updatingElement, setUpdatingElement] = useState<Element | null>();
  const [updating, setUpdating] = useState<boolean>(false);

  const [shareModal, setShareModal] = useAtom(showShareModalAtom);

  const searchParams = useSearchParams();
  const {
    svgRef,
    handleSvgPointerDown,
    handleSvgPointerMove,
    handleSvgPointerUp,
  } = useSvg({ tool });

  const imageInputRef = useRef<HTMLInputElement>(null);

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
          console.log("Text is", lines);

          for (const line of lines) {
            const lineContainer = document.createElement("div");
            lineContainer.innerText = line || "\u00A0";
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
    boardRef.current.style.width = `${width}px`;
    boardRef.current.style.height = `${height}px`;
    renderElements();
  }, []);

  // Set up event listeners
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

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

  const renderElements = useCallback(() => {
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

    // console.log("Elements are ", elements);

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
    boardRef.current?.height,
    boardRef.current?.width,
  ]);

  // Draw the canvas
  useEffect(() => {
    renderElements();
  }, [
    elements,
    selectedElement,
    scaleOffset,
    panOffset,
    scale,
    action,
    drawingElement,
    resizeCanvas,
    updatingElement,
  ]);

  // Utility function to get mouse coordinates adjusted for pan and scale
  const getMouseCoordinates = (
    event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
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
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
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
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
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
      setPanOffset((prevState) => ({
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
  const handlePointerUp = async () => {
    // Handle erasing
    if (action === "erasing") {
      if (eraseElements.length === 0) {
        setAction("none");
        return;
      }
      const newElements = finalizeErasing(elements, eraseElements);

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
      const convertedElement = await convertElement(
        drawingElement as Element,
        boardRef as React.RefObject<HTMLCanvasElement>,
        getImage,
        db,
        storeImage
      );
      setElements([
        ...elements,
        {
          ...convertedElement,
        },
      ] as HistoryState);
      setDrawingElement(null);
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
  const handleDrawingTextBlur = async () => {
    if (
      !drawingElement ||
      drawingElement.type !== "text" ||
      !textElementRef.current
    )
      return;

    if (drawingElement.text != "" && drawingElement.text != "\n") {
      const updatedElement = await convertElement(
        drawingElement as Element,
        boardRef as React.RefObject<HTMLCanvasElement>,
        getImage,
        db,
        storeImage
      );

      setElements([...elements, updatedElement] as HistoryState);
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

  const handleUpdatingTextBlur = async () => {
    if (
      !updatingElement ||
      updatingElement.type !== "text" ||
      !updatingElementRef.current
    )
      return;

    if (updatingElement.text === "" || updatingElement.text === "\n") {
      deleteElement(elements, updatingElement, setUpdatingElement, setElements);
    } else {
      const updatedElement = await convertElement(
        updatingElement as Element,
        boardRef as React.RefObject<HTMLCanvasElement>,
        getImage,
        db,
        storeImage
      );

      const newElements = [...elements];

      const index = newElements.findIndex((ele) => {
        return updatingElement.id === ele.id;
      });

      newElements[index] = updatedElement as Element;

      setElements(newElements);

      setUpdatingElement(null);
    }

    setTool("select");
    setAction("selecting");
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
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

  const handleImageInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files as FileList;
    const imageElements = [];

    // Create all image elements with proper positioning
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const element = await createImageElement(file, i, files.length);
      imageElements.push(element);
      await storeImage(file, element.id);
    }

    const updatedElements = updateImageElementCoordinates(imageElements);
    setElements([...elements, ...updatedElements]);
  };

  async function createImageElement(
    file: File,
    index: number,
    totalFiles: number
  ): Promise<ImageElement> {
    const { height, width, url, aspectRatio } = await getImageDimensions(file);

    const x1 = panOffset.x * scale;
    const y1 = panOffset.y * scale;

    return {
      id: crypto.randomUUID(),
      type: "image",
      x1: x1,
      y1: y1,
      x2: x1 + width,
      y2: y1 + height,
      height: height,
      width: width,
      url: url,
      aspectRatio,
    };
  }

  const getImageDimensions = (
    file: File
  ): Promise<{
    width: number;
    height: number;
    url: string;
    aspectRatio: number;
  }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          url,
          aspectRatio: img.width / img.height,
        });
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  };

  const updateImageElementCoordinates = (elements: ImageElement[]) => {
    const updatedElements = [...elements];
    const totalElements = updatedElements.length;
    const initX = updatedElements[0].x1;
    const initY = updatedElements[0].y1;
    let maxHeight = updatedElements[0].height;

    for (let i = 1; i < elements.length; i++) {
      if (i === Math.ceil(totalElements / 2)) {
        updatedElements[i].x1 = initX;
        updatedElements[i].y1 = initY + maxHeight;
        updatedElements[i].x2 = initX + updatedElements[i].width;
        updatedElements[i].y2 = initY + updatedElements[i].height;
      } else {
        updatedElements[i].x1 = updatedElements[i - 1].x2;
        updatedElements[i].y1 = updatedElements[i - 1].y1;
        updatedElements[i].x2 =
          updatedElements[i - 1].x2 + updatedElements[i].width;
        updatedElements[i].y2 =
          updatedElements[i - 1].y1 + updatedElements[i].height;
      }

      maxHeight = Math.max(updatedElements[i].height, maxHeight);
    }

    return updatedElements;
  };

  useEffect(() => {
    const id = searchParams.get("id");

    async function loadElementsFromClientStorage() {
      if (!db) {
        console.log("Waiting for database to be ready...");
        return false;
      }

      const savedElements = loadElementsFromStorage();
      if (!savedElements) {
        return false;
      }

      console.log(
        "Converting saved elements with DB:",
        db ? "available" : "not available"
      );
      const convertedElements = await convertElements(
        savedElements,
        boardRef as React.RefObject<HTMLCanvasElement>,
        getImage,
        db,
        storeImage
      );

      return convertedElements;
    }

    if (!id) {
      if (db) {
        // Only proceed if db is ready
        loadElementsFromClientStorage().then((resolve) => {
          if (!resolve) return;
          setElements(resolve as HistoryState);
          setLoadingSavedElements(false);
        });
      }
      return;
    }

    console.log("Sending the request");
    if (db) {
      axios
        .get("http://localhost:8080/fetch-elements", {
          params: { id: id },
        })
        .then((response) => {
          console.log("Loading the Response is", response);

          setTimeout(async () => {
            // convert received elements
            const newElements = await convertElements(
              response.data.elements,
              boardRef as React.RefObject<HTMLCanvasElement>,
              getImage,
              db,
              storeImage
            );

            setElements(newElements as Element[]);
            setScale(response.data.scale);
            setPanOffset(response.data.panOffset);

            setLoadingSavedElements(false);
          }, 0);
        });
    }
  }, [db, searchParams]);

  // For Insert Image Function
  useEffect(() => {
    if (tool === "insert-image" && imageInputRef.current) {
      imageInputRef.current.click();
      setTool("select");
    }
  }, [tool]);
  return (
    <div
      onPointerUp={() => {
        handlePointerUp();
        handleSvgPointerUp();
      }}
      className="relative z-0"
    >
      {/*Image Drag and Drop*/}
      <div className="-z-20 hidden w-[100%] h-[100%]  fixed">
        <input
          multiple
          type="file"
          onChange={handleImageInputChange}
          ref={imageInputRef}
        />
      </div>

      {/*Side Menu */}
      <div
        className="fixed top-4 left-4 z-[100] cursor-pointer"
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
        <SideMenu setElements={setElements}></SideMenu>
      </div>

      {/* Toolbar */}
      <div
        className="fixed flex top-4 left-1/2 -translate-x-1/2 items-center gap-2 z-20"
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

      {/*Share Button */}
      <div
        className="fixed right-5 top-4 z-20"
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
        <ShareButton></ShareButton>
      </div>

      {/*Share Modal*/}
      {shareModal && (
        <div className="fixed w-full h-full z-[1000] flex justify-center items-center">
          <div
            className={`z-10 w-[600px]  rounded-md p-16 ${
              darkMode ? "bg-[#232329] text-white" : "bg-white text-black"
            } `}
          >
            <ShareModal
              elements={elements as Element[]}
              panOffset={panOffset}
              scale={scale}
            ></ShareModal>
          </div>
          <div
            className="fixed w-full h-full bg-black opacity-15 "
            onClick={() => {
              setShareModal(false);
            }}
          ></div>
        </div>
      )}

      {/* Undo/Redo Controls */}
      <div
        className="fixed bottom-5 left-6 rounded-md shadow-lg z-20"
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
        className="fixed bottom-5 right-6 rounded-md shadow-lg z-20"
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
          className={`fixed top-28 left-5 p-4 rounded-md shadow-lg z-20 ${
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
              const sanitizedText = event.currentTarget.innerText.replace(
                /\n\n/g,
                "\n"
              );
              console.log("Sanitized is", sanitizedText);
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
      <div
        style={{ cursor: getCursorForTool() }}
        onPointerDown={(event) => {
          handlePointerDown(event);
          handleSvgPointerDown(event);
        }}
        onPointerMove={(event) => {
          handlePointerMove(event);
          handleSvgPointerMove(event);
        }}
        onDoubleClick={(event) => {
          handleDoubleClick(event);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation(); // Stop the event from bubbling further

          if (imageInputRef.current) {
            imageInputRef.current.files = event.dataTransfer.files;
            console.log("Dropping the files");
            imageInputRef.current.dispatchEvent(
              new Event("change", { bubbles: true })
            );
          }
        }}
        onDragOver={(event) => event.preventDefault()} // Needed to allow dropping
        className="touch-none"
      >
        <div
          id="svg-wrapper"
          className="fixed w-[100%] h-[100%]"
        >
          <svg
            ref={svgRef}
            className=" w-[100%] h-[100%]"
            pointerEvents="none"
          ></svg>
        </div>

        <canvas
          ref={boardRef}
          className={`${darkMode ? "bg-black" : "bg-white"} -z-10 touch-none`}
        />
      </div>
    </div>
  );
}
