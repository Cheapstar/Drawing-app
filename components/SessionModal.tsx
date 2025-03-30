"use client";

import { collabNameAtom, socketAtom } from "@/store/store";
import { useAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";

import { useState } from "react";

import { FaStop } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import { MdOutlineContentCopy } from "react-icons/md";
import { TiTick } from "react-icons/ti";

type LoadingState = "none" | "stop-session" | "copying";

export function SessionModal() {
  const [loadingState, setLoadingState] = useState<LoadingState>("none");
  const [socket] = useAtom(socketAtom);
  const [collabName] = useAtom(collabNameAtom);
  const searchParams = useSearchParams();
  const roomId = searchParams.get("join");

  const router = useRouter();
  const handleStopSession = () => {
    setLoadingState("stop-session");
    if (socket) {
      socket.send("leave-room", { roomId });
    }

    router.push("/");
  };

  const handleCopy = async () => {
    if (!roomId) return;

    setLoadingState("copying");

    try {
      await navigator.clipboard.writeText(
        `http://localhost:3000/collab?join=${roomId}`
      );

      setTimeout(() => {
        setLoadingState("none");
      }, 1000);
    } catch (error) {
      console.error("Copy failed:", error);
      setLoadingState("none");
    }
  };
  return (
    <div
      className="flex flex-col w-full"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4 font-sans">
          <h1 className="text-[#0D92F4] text-xl font-bold text-center">
            Live Collaboration
          </h1>
          <div className="flex flex-col gap-2">
            <p>Name</p>
            <p
              className="text-md bg-gray-300 font-sans font-normal
             rounded-md px-3 py-2 grow text-nowrap overflow-hidden text-ellipsis"
            >
              {collabName}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="">Link</p>
            <div className="flex gap-2  w-full ">
              <p
                className="w-[70%] text-md bg-gray-300 font-sans font-normal
             rounded-md px-3 py-2 grow text-nowrap overflow-hidden text-ellipsis"
              >
                {`http://localhost:3000/collab?join=${roomId}`}
              </p>
              {loadingState === "copying" ? (
                <p className="bg-green-300 rounded-md px-2 py-2 text-white w-[30%] flex justify-center items-center">
                  <TiTick className="text-2xl"></TiTick>
                </p>
              ) : (
                <button
                  className="flex items-center gap-2 bg-[#0D92F4] text-white w-[30%] justify-center
                    px-2 rounded-md hover:bg-[#006BFF] transition-all cursor-pointer font-sans text-sm"
                  onClick={handleCopy}
                  disabled={loadingState !== "none"}
                >
                  <MdOutlineContentCopy></MdOutlineContentCopy>
                  Copy Link
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="font-sans flex flex-col gap-3">
          <p className="text-sm text-center">
            Invite people to collaborate on your drawing.
          </p>
          <p className="text-sm text-center">
            Stopping the session will disconnect you from the room, but you'll
            be able to continue working with the scene, locally. Note that this
            won't affect other people, and they'll still be able to collaborate
            on their version.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            className="bg-[#0D92F4] text-white text-normal gap-2
                font-semibold font-sans px-4 py-2.5 rounded-md flex items-center
                justify-center cursor-pointer hover:bg-[#006BFF] transition-all 
                disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleStopSession}
            disabled={loadingState !== "none"}
          >
            {loadingState === "stop-session" ? (
              <div className="flex items-center gap-2">
                <ImSpinner8 className="animate-spin"></ImSpinner8>
                Stop Session
              </div>
            ) : (
              <>
                <FaStop className="mr-2"></FaStop>
                Stop Session
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
