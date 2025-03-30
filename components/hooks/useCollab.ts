"use client";

import { collabNameAtom, socketAtom } from "@/store/store";
import {
  Action,
  Element,
  FreehandElement,
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
import { adjustElementCoordinates } from "@/Geometry/utils";
import { getTextElementDetails } from "@/Geometry/text/boundingElement";

interface props {
  drawingElement: Element | null;
  selectedElement: Element | null;
  updatingElement: Element | null;
  action: Action | null;
  panOffset: Point;
  scale: number;
  scaleOffset: Point;
  boardRef: React.RefObject<HTMLCanvasElement | null>;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setPanOffset: React.Dispatch<React.SetStateAction<Point>>;
  setElements: SetHistoryState;
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
  action,
  panOffset,
  scale,
  scaleOffset,
  boardRef,
  setScale,
  setPanOffset,
  setElements,
}: props) {
  const [socket, setSocket] = useAtom(socketAtom);
  const [collabName, setCollabName] = useAtom(collabNameAtom);
  const [mouse, setMouse] = useState<Point>({ x: 0, y: 0 });
  const [userId, setUserId] = useState<string>("");
  const searchParams = useSearchParams();
  const roomId = searchParams.get("join");
  const [participants, setParticpants] = useState<Participant[]>([]);
  const [remoteElements, setRemoteElements] = useState<Element[]>([]);

  useEffect(() => {
    const connectWebSocket = async () => {
      const id = crypto.randomUUID();

      const socketClient = new WebSocketClient(
        `ws://localhost:8080?userId=${id}`
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

        setCollabName(userName);
        socketClient.send("join-room", { roomId, name: userName });
      });
    });

    function updateMouseMovement(event: MouseEvent) {
      setMouse({ x: event.clientX, y: event.clientY });
    }

    window.addEventListener("mousemove", updateMouseMovement);

    return () => {
      if (socket && socket.exists()) {
        socket.close();
      }
      window.removeEventListener("mousemove", updateMouseMovement);
    };
  }, []);

  useEffect(() => {
    if (drawingElement && socket && socket.exists()) {
      socket.send("drawing-element", { element: drawingElement, roomId });
    }
  }, [drawingElement, socket]);

  /*
    Let's render the mouse first
  */
  const getMouseCoordinates = (mouse: Point): Point => {
    const x = (mouse.x - panOffset.x * scale + scaleOffset.x) / scale;
    const y = (mouse.y - panOffset.y * scale + scaleOffset.y) / scale;
    return { x, y };
  };

  useEffect(() => {
    if (socket && socket.exists()) {
      const position = getMouseCoordinates(mouse);
      socket?.send("mouse-position", { position: position, roomId, userId });
    }
  }, [mouse, panOffset, scale, scaleOffset, socket]);

  useEffect(() => {
    if (socket) {
      socket.on("participant-position", (payload: Participant) => {
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

  useEffect(() => {
    if (socket) {
      socket.on("room-joined", (payload: BoardStateType) => {
        console.log("Setting the Params");

        setScale(payload.scale);
        setPanOffset(payload.panOffset);
        setElements(payload.elements);
      });
    }
  }, [socket]);

  useEffect(() => {
    if (!remoteElements || remoteElements.length <= 0) return;
    setElements((prevState) => {
      // First, create a copy of the previous state
      const newState = [...prevState.map((ele) => ({ ...ele }))];

      // For each remote element, either update existing or add new
      remoteElements.forEach((remoteElement) => {
        const index = newState.findIndex((ele) => ele.id === remoteElement.id);

        let newElement = { ...remoteElement };

        if (remoteElement.type === "line") {
          const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
            remoteElement as Element
          );

          newElement = {
            ...newElement,
            x1: newX1,
            y1: newY1,
            x2: newX2,
            y2: newY2,
            controlPoint: {
              x: ((newX1 as number) + (newX2 as number)) / 2,
              y: ((newY1 as number) + (newY2 as number)) / 2,
            },
          };
        } else if (remoteElement.type === "rectangle") {
          const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
            remoteElement as RectangleElement
          );

          newElement = {
            ...newElement,
            ...{
              x1: newX1,
              y1: newY1,
              x2: newX2,
              y2: newY2,
            },
          };
        } else if (remoteElement.type === "freehand") {
          const { newX1, newY1, newX2, newY2 } = adjustElementCoordinates(
            remoteElement as FreehandElement
          );

          newElement = {
            ...remoteElement,
            ...{
              x1: newX1,
              y1: newY1,
              x2: newX2,
              y2: newY2,
            },
          };
        } else if (remoteElement.type === "text") {
          const ctx = boardRef.current?.getContext("2d");
          if (!ctx) return;

          ctx.save();
          ctx.font = `${remoteElement.fontSize}px ${remoteElement.fontFamily}`;

          const text = remoteElement.text || "";

          newElement = {
            ...remoteElement,
            text,
            ...getTextElementDetails(remoteElement, ctx),
          };
          ctx.restore();
        }

        if (index === -1) {
          // This is a new element, add it
          newState.push({ ...newElement });
        } else {
          // This is an existing element, update it
          newState[index] = { ...newElement };
        }
      });

      return newState;
    });

    // Clear the remoteElements after they've been processed
    // This is important to prevent reprocessing the same elements
    setRemoteElements([]);
  }, [remoteElements]);

  return {
    participants,
    remoteElements,
  };
}
