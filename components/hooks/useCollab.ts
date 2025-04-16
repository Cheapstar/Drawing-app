"use client";

import { collabNameAtom, socketAtom } from "@/store/store";
import {
  Action,
  Element,
  FreehandElement,
  ImageElement,
  LineElement,
  Point,
  RectangleElement,
  TextElement,
} from "@/types/types";
import { WebSocketClient } from "@/WebSocketClient";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  adjectives,
  names,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { SetHistoryState } from "./history";
import { useSearchParams } from "next/navigation";
import {
  adjustElementCoordinates,
  convertElement,
  convertElements,
} from "@/Geometry/utils";
import { getTextElementDetails } from "@/Geometry/text/boundingElement";
import { ImageRecord, ImagesDBSchema } from "./useIndexedDBImages";
import { IDBPDatabase } from "idb";

interface props {
  drawingElement: Element | null;
  selectedElement: Element | null;
  updatingElement: Element | null;
  eraseElements: Element[];
  action: Action | null;
  panOffset: Point;
  scale: number;
  scaleOffset: Point;
  boardRef: React.RefObject<HTMLCanvasElement | null>;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>;
  setElements: SetHistoryState;
  getImage: (
    id: string,
    DB: IDBPDatabase<ImagesDBSchema> | null
  ) => Promise<ImageRecord | null>;
  db: IDBPDatabase<ImagesDBSchema> | null;
  storeImage: (
    file: File,
    id: string,
    name?: string
  ) => Promise<ImageRecord | null>;
}
interface BoardStateType {
  elements: Element[];
  scale: number;
  panOffset: Point;
}

export interface Participant {
  position: Point;
  userId: string;
  userDetails: UserDetails;
}
export interface UserDetails {
  color: string;
  userName: string;
}

interface NewElementPayload {
  newElement: Element;
}

/*
  Here We Need an socket 
  Now Each Time Any of the above element change honge agar null nahi hai then
  We will send the request to server , jo then pass onto the other participants

  -- Add karna hai lock field logic , joki hoga first come first serve to ensure state remain in sync
    across the whole team

  Similarly , as Element update ka jaise client ko request hume make sure karna hai 
  to update the element as per the request ---> "move" || "resize" || "edit" || "delete" || "draw"
  
  On Client side , we can go with two approaches :
    1. keep updating the main elements array causing element to rerender again and again
    2. keep the current selected element in different array -- but then when do we shift it

  1. Let's send the Drawing Element to the Backend
 */

export function useCollab({
  drawingElement,
  selectedElement,
  updatingElement,
  eraseElements,
  action,
  panOffset,
  scale,
  scaleOffset,
  boardRef,
  setScale,
  setPanOffset,
  setElements,
  db,
  storeImage,
  getImage,
}: props) {
  const [socket, setSocket] = useAtom(socketAtom);
  const [collabName, setCollabName] = useAtom(collabNameAtom);
  const [mouse, setMouse] = useState<Point>({ x: 0, y: 0 });
  const [userId, setUserId] = useState<string>("");
  const searchParams = useSearchParams();
  const roomId = searchParams.get("join");
  const [participants, setParticpants] = useState<Participant[]>([]);
  const [remoteElements, setRemoteElements] = useState<Element[]>([]);
  const [movingElements, setMovingElements] = useState<Element[]>([]);
  const [resizeElement, setResizeElement] = useState<Element[]>([]);
  const [remoteEraseElements, setRemoteEraseElements] = useState<Element[]>([]);
  const [remoteUpdatedElement, setRemoteUpdateElement] = useState<Element>();
  const [imageElements, setImageElements] = useState<Element[]>([]);
  const [initialData, setInitialData] = useState<Element[]>([]);

  useEffect(() => {
    if (db) {
      console.log("Runnning");
      const connectWebSocket = async () => {
        const id = crypto.randomUUID();

        const socketClient = new WebSocketClient(
          `ws://localhost:8080?userId=${id}`,
          roomId as string
        );

        setSocket(socketClient);
        setUserId(id);
        return socketClient;
      };

      connectWebSocket().then((socketClient) => {
        socketClient.on("userRegistered", () => {
          const userName = uniqueNamesGenerator({
            dictionaries: [names, adjectives],
          });

          console.log("User Name is", userName);
          setCollabName(userName);
          socketClient.send("join-room", { roomId, name: userName });
        });
      });

      function handleBeforeUnload(event: BeforeUnloadEvent) {
        if (socket && socket.exists()) {
          socket.send("leave-room", { roomId });
        }
      }
      function updateMouseMovement(event: MouseEvent) {
        setMouse({ x: event.clientX, y: event.clientY });
      }
      window.addEventListener("mousemove", updateMouseMovement);
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      console.log("Db is");
      if (db) {
        if (socket && socket.exists()) {
          socket.send("leave-room", { roomId });
          socket.close();
        }
        function handleBeforeUnload(event: BeforeUnloadEvent) {
          if (socket && socket.exists()) {
            socket.send("leave-room", { roomId });
          }
        }
        function updateMouseMovement(event: MouseEvent) {
          setMouse({ x: event.clientX, y: event.clientY });
        }
        window.removeEventListener("mousemove", updateMouseMovement);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
    };
  }, [db]);

  // Send The New Element Details That is being Drawn
  useEffect(() => {
    if (drawingElement && socket && socket.exists()) {
      socket.send("drawing-element", { element: drawingElement, roomId });
    }
  }, [drawingElement, socket]);

  // Send the Moved Element Details
  useEffect(() => {
    if (action === "moving" && selectedElement && socket && socket.exists()) {
      socket.send("element-moves", {
        element: selectedElement,
        roomId,
      });
    }

    if (action === "resizing" && selectedElement && socket && socket.exists()) {
      console.log("Element Resizing");
      socket.send("element-resize", {
        element: selectedElement,
        roomId,
      });
    }
  }, [selectedElement, socket, action]);

  // erasing Them Elements
  useEffect(() => {
    if (
      eraseElements &&
      eraseElements.length > 0 &&
      socket &&
      socket.exists()
    ) {
      socket.send("elements-erase", { elements: eraseElements, roomId });
    }
  }, [eraseElements, socket]);

  // Send the details about element that is being updated
  useEffect(() => {
    if (updatingElement && socket && socket.exists()) {
      socket.send("element-update", {
        roomId,
        element: updatingElement,
      });
    }
  }, [updatingElement, socket]);

  const getMouseCoordinates = (mouse: Point): Point => {
    const x = (mouse.x - panOffset.x * scale + scaleOffset.x) / scale;
    const y = (mouse.y - panOffset.y * scale + scaleOffset.y) / scale;
    return { x, y };
  };

  //
  useEffect(() => {
    if (socket && socket.exists()) {
      const position = getMouseCoordinates(mouse);
      socket?.send("mouse-position", { position: position, roomId, userId });
    }
  }, [mouse, panOffset, scale, scaleOffset, socket]);

  /*
    Let's render the mouse first
  */

  // Socket , Setting Up The  Socket Events
  useEffect(() => {
    if (socket) {
      socket.on("participant-position", (payload: Participant) => {
        console.log("Setting the Participant Position");
        setParticpants((curr: Participant[]) => {
          // console.log("Particpants are", curr);
          const index = curr?.findIndex(({ userId }) => {
            return userId === payload.userId;
          });

          if (index != -1) {
            const updatedParticipants = [...curr];
            updatedParticipants[index].position = payload.position;
            updatedParticipants[index].userDetails = payload.userDetails;

            return updatedParticipants;
          }

          return [
            ...curr,
            {
              position: payload.position,
              userId: payload.userId,
              userDetails: {
                ...payload.userDetails,
              },
            },
          ];
        });
      });

      socket.on("draw-element", (payload: NewElementPayload) => {
        setRemoteElements((elements) => {
          const { newElement } = payload;
          const index = elements.findIndex((ele) => ele.id === newElement.id);

          const updatedElements = [...elements.map((el) => ({ ...el }))];

          if (index === -1) {
            updatedElements.push({ ...newElement });
          } else {
            updatedElements[index] = { ...newElement };
          }

          return updatedElements;
        }); // Pass true as the second parameter to indicate this is an overwrite
      });

      socket.on("move-element", (payload) => {
        setMovingElements((elements) => {
          const { element } = payload;
          const index = elements.findIndex((ele) => ele.id === element.id);

          const updatedElements = [...elements.map((el) => ({ ...el }))];

          if (index === -1) {
            updatedElements.push({ ...element });
          } else {
            updatedElements[index] = {
              ...updatedElements[index],
              x1: element.x1,
              x2: element.x2,
              y1: element.y1,
              y2: element.y2,
            };
          }

          return updatedElements;
        });
      });

      socket.on("resize-element", (payload) => {
        setResizeElement((elements) => {
          const { element } = payload;
          const index = elements.findIndex((ele) => ele.id === element.id);

          const updatedElements = [...elements.map((el) => ({ ...el }))];

          if (index === -1) {
            updatedElements.push({ ...element });
          } else {
            updatedElements[index] = {
              ...updatedElements[index],
              x1: element.x1,
              x2: element.x2,
              y1: element.y1,
              y2: element.y2,
              height: element.height,
              width: element.width,
            };

            if (element.type === "line") {
              (updatedElements[index] as LineElement).controlPoint =
                element.controlPoint;
            }
          }

          return updatedElements;
        });
      });

      socket.on("erase-elements", (payload) => {
        console.log("Erasing the Elements", payload);
        setRemoteEraseElements(payload.elements);
      });

      socket.on("update-element", (payload) => {
        console.log("Running Bhai");
        setRemoteUpdateElement(payload.element);
      });

      socket.on("add-images", (payload) => {
        setImageElements(payload.elements);
      });
      socket.on("remove-participant", (payload) => {
        setParticpants((curr) => {
          const index = curr.findIndex((p) => p.userId === payload.userId);

          if (index != -1) {
            const updatedParticipants = [...curr];
            updatedParticipants.splice(index, 1);

            return updatedParticipants;
          }

          return curr;
        });
      });
    }
  }, [socket]);

  // Update the Main Elements Array With Recieved Elements
  useEffect(() => {
    if (!remoteElements || remoteElements.length <= 0 || !db) return;

    setElements((prevState) => {
      console.log("Prev State", prevState);
      // First, create a copy of the previous state
      const newState = [...prevState.map((ele) => ({ ...ele }))];

      // For each remote element, either update existing or add new
      remoteElements.forEach(async (remoteElement) => {
        const index = newState.findIndex((ele) => ele.id === remoteElement.id);

        // Pass all required parameters to convertElement
        const newElement = await convertElement(
          remoteElement,
          boardRef as React.RefObject<HTMLCanvasElement>,
          getImage,
          db,
          storeImage
        );

        if (index === -1) {
          // This is a new element, add it
          newState.push({ ...(newElement as Element) });
        } else {
          // This is an existing element, update it
          newState[index] = { ...newElement } as Element;
        }
      });

      return newState;
    });

    // Clear the remoteElements after they've been processed
    // This is important to prevent reprocessing the same elements
    setRemoteElements([]);
  }, [remoteElements, db, setElements]);

  // Update the Moved Elements Details
  useEffect(() => {
    if (!movingElements || movingElements.length <= 0) return;
    setElements((prevState) => {
      // First, create a copy of the previous state
      const newState = [...prevState.map((ele) => ({ ...ele }))];

      // For each remote element, either update existing or add new
      movingElements.forEach((movedElement) => {
        const index = newState.findIndex((ele) => ele.id === movedElement.id);

        const newElement = { ...movedElement };

        if (index === -1) {
          // Me Being lazy
          newState.push({ ...newElement });
        } else {
          // This is an existing element, update it
          console.log("Updating/Moving the element");
          newState[index] = {
            ...newElement,
            url: (newState[index] as ImageElement).url,
          } as Element;
        }
      });

      return newState;
    });

    // Clear the remoteElements after they've been processed
    // This is important to prevent reprocessing the same elements
    setMovingElements([]);
  }, [movingElements, setElements]);

  useEffect(() => {
    if (!resizeElement || resizeElement.length <= 0) return;
    setElements((prevState) => {
      // First, create a copy of the previous state
      const newState = [...prevState.map((ele) => ({ ...ele }))];

      // For each remote element, either update existing or add new
      resizeElement.forEach((resizedElement) => {
        const index = newState.findIndex((ele) => ele.id === resizedElement.id);

        const newElement = { ...resizedElement };

        if (index === -1) {
          // Me Being lazy
          newState.push({ ...newElement });
        } else {
          // This is an existing element, update it
          newState[index] = {
            ...newElement,
            url: (newState[index] as ImageElement).url,
          } as Element;

          if (resizedElement.type === "line") {
            (newState[index] as LineElement).controlPoint =
              resizedElement.controlPoint;
          }
        }
      });

      return newState;
    });

    // Clear the remoteElements after they've been processed
    // This is important to prevent reprocessing the same elements
    setResizeElement([]);
  }, [resizeElement, setElements]);

  // Erase Them Elements
  useEffect(() => {
    if (!remoteEraseElements || remoteEraseElements.length <= 0) return;
    console.log("Remote Erase Elements", remoteEraseElements);
    setElements((prevState) => {
      const newState = [...prevState.map((ele) => ({ ...ele }))];

      return newState.filter(
        (element) =>
          !remoteEraseElements.some(
            (eraseElement) => eraseElement.id === element.id
          )
      );
    });

    setRemoteEraseElements([]);
  }, [remoteEraseElements]);

  // Update the remote updated Element
  useEffect(() => {
    if (remoteUpdatedElement && db) {
      console.log("Updating the Element");

      async function settingUpdatedElements() {
        console.log("remote update element", remoteUpdatedElement);

        const convertedElement = await convertElement(
          remoteUpdatedElement as Element,
          boardRef as React.RefObject<HTMLCanvasElement>,
          getImage,
          db,
          storeImage
        );

        setElements((prevState) => {
          const index = prevState.findIndex(
            (ele) => ele.id === (convertedElement as Element).id
          );

          if (index == -1) {
            return prevState;
          }

          const newElements = [...prevState.map((ele) => ({ ...ele }))];

          newElements[index] = convertedElement as Element;

          return newElements;
        });
        setRemoteUpdateElement(undefined);
      }
      settingUpdatedElements();
    }
  }, [remoteUpdatedElement, db, setElements]);

  useEffect(() => {
    if (imageElements.length > 0 && db) {
      async function settingImageElements() {
        const convertedElements = await convertElements(
          imageElements,
          boardRef as React.RefObject<HTMLCanvasElement>,
          getImage,
          db,
          storeImage
        );

        setElements((prevState) => [
          ...prevState,
          ...(convertedElements as Element[]),
        ]);
        setImageElements([]);
      }

      settingImageElements();
    }
  }, [imageElements, db]);

  // Load The Initial Data Recieved From The Server
  useEffect(() => {
    if (socket && db) {
      socket.on("room-joined", (payload: BoardStateType) => {
        console.log("Setting the Params");

        setScale(payload.scale);
        setPanOffset(payload.panOffset);
        setInitialData(payload.elements);
      });
    }
  }, [socket, db]);

  useEffect(() => {
    if (initialData.length > 0 && db) {
      async function settingInitialData() {
        const convertedElements = await convertElements(
          initialData,
          boardRef as React.RefObject<HTMLCanvasElement>,
          getImage,
          db,
          storeImage
        );

        setElements(convertedElements as Element[]);
      }

      settingInitialData();
    }
  }, [initialData, db]);
  return {
    participants,
    remoteElements,
    socket,
  };
}
