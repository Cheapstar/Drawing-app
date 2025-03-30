"use client";

import axios from "axios";
import { GoPaperclip } from "react-icons/go";
import { Element, Point } from "@/types/types";
import { useState } from "react";
import { MdOutlineContentCopy } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import { FaPlay } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";

import { useRouter } from "next/navigation";

type LoadingState = "none" | "sharing-link" | "copying" | "starting-session";

export function ShareModal({
  elements,
  panOffset,
  scale,
}: {
  elements: Element[];
  panOffset: Point;
  scale: number;
}) {
  const [loadingState, setLoadingState] = useState<LoadingState>("none");
  const [sharedLink, setSharedLink] = useState<string | null>(null);
  const router = useRouter();

  const handleShareAbleLink = async () => {
    setLoadingState("sharing-link");

    await new Promise((resolve) => setTimeout(resolve, 2000));
    axios
      .post("http://localhost:8080/create-link", {
        elements: elements,
        panOffset,
        scale,
      })
      .then((response) => {
        setLoadingState("none");
        setSharedLink(response.data.id);
      })
      .catch((error) => {
        console.error("Error creating share link:", error);
        setLoadingState("none");
      });
  };

  const handleCopy = async () => {
    if (!sharedLink) return;

    setLoadingState("copying");

    try {
      await navigator.clipboard.writeText(
        `http://localhost:3000?id=${sharedLink}`
      );

      setTimeout(() => {
        setLoadingState("none");
      }, 1000);
    } catch (error) {
      console.error("Copy failed:", error);
      setLoadingState("none");
    }
  };

  const handleStartSession = () => {
    setLoadingState("starting-session");
    axios
      .post("http://localhost:8080/start-session", {
        elements,
        scale,
        panOffset,
      })
      .then((response) => {
        console.log("response", response.data.roomId);
        router.push(`/collab?join=${response.data.roomId}`);
      })
      .catch((error) => {
        console.error("Error starting session:", error);
        setLoadingState("none");
      });
  };

  return (
    <div
      className="flex flex-col w-full"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {sharedLink ? (
        <div className="py-8 flex flex-col gap-6 w-full">
          <h1 className="text-[#0D92F4] text-2xl font-bold font-sans">
            Shareable Link
          </h1>
          <div className="flex gap-2 overflow-hidden w-full ">
            <p
              className="w-[70%] text-md bg-gray-300 font-sans font-normal
             rounded-md px-3 py-2 grow text-nowrap overflow-hidden text-ellipsis"
            >
              {`http://localhost:3000?id=${sharedLink}`}
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
          <p className="text-[12px] font-sans px-2">
            🔒 The upload has been secured with end-to-end encryption, which
            means that Excalidraw server and third parties can't read the
            content.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4 font-sans">
            <h1 className="text-[#0D92F4] text-xl font-bold text-center">
              Live Collaboration
            </h1>
            <div className="flex justify-center">
              <button
                className="bg-[#0D92F4] text-white text-normal gap-2
                font-semibold font-sans px-4 py-2.5 rounded-md flex items-center
                justify-center cursor-pointer hover:bg-[#006BFF] transition-all 
                disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleStartSession}
                disabled={loadingState !== "none"}
              >
                {loadingState === "starting-session" ? (
                  <div className="flex items-center gap-2">
                    <ImSpinner8 className="animate-spin"></ImSpinner8>
                    Start Session
                  </div>
                ) : (
                  <>
                    <FaPlay className="mr-2"></FaPlay>
                    Start Session
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-center">
              Invite people to collaborate on your drawing.
            </p>
            <p className="text-sm text-center">
              Don't worry, the session is end-to-end encrypted, and fully
              private. Not even our server can see what you draw.
            </p>
          </div>

          <div className="border-t flex justify-center">
            <span className="block font-sans -translate-y-3.5 bg-white px-2">
              Or
            </span>
          </div>

          <div className="flex flex-col justify-center items-center gap-4 font-sans">
            <h1 className="text-[#0D92F4] text-xl font-bold ">
              Shareable Link
            </h1>
            <p className="text-sm">Export Data as a Link</p>
            <div>
              <button
                className="bg-[#0D92F4] text-white text-normal gap-2
                font-semibold font-sans px-4 py-2.5 rounded-md flex items-center
                justify-center cursor-pointer hover:bg-[#006BFF] transition-all
                disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleShareAbleLink}
                disabled={loadingState !== "none"}
              >
                {loadingState === "sharing-link" ? (
                  <div className="flex items-center gap-2">
                    <ImSpinner8 className="animate-spin"></ImSpinner8>
                    Exporting...
                  </div>
                ) : (
                  <>
                    <GoPaperclip className="mr-2"></GoPaperclip>
                    Export To Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
