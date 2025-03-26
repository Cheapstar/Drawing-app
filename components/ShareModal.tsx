"use client";

import axios from "axios";
import { GoPaperclip } from "react-icons/go";
import { Element, Point } from "@/types/types";
import { useState } from "react";
import { MdOutlineContentCopy } from "react-icons/md";
import { TiTick } from "react-icons/ti";
export function ShareModal({
  elements,
  panOffset,
  scale,
}: {
  elements: Element[];
  panOffset: Point;
  scale: number;
}) {
  const [shareLinkButtonLoading, setShareLinkButtonLoading] =
    useState<boolean>(false);
  const [sharedLink, setSharedLink] = useState<boolean>(false);

  const [copying, setCopying] = useState<boolean>(false);

  const handleShareAbleLink = () => {
    setShareLinkButtonLoading(true);
    axios
      .post("http://localhost:8080/create-link", {
        elements: elements,
        panOffset,
        scale,
      })
      .then((response) => {
        console.log("Message", response);
        setShareLinkButtonLoading(false);
        setSharedLink(response.data.id);
      });
  };

  const handleCopy = async () => {
    setCopying(true);

    await navigator.clipboard.writeText(
      `http://localhost:3000?id=${sharedLink}`
    );

    setTimeout(() => {
      setCopying(false);
    }, 1000);
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
            {copying ? (
              <p className="bg-green-300 rounded-md px-2 py-2 text-white w-[30%] flex justify-center">
                <TiTick className="text-2xl"></TiTick>
              </p>
            ) : (
              <button
                className="flex items-center gap-1 bg-[#0D92F4] text-white w-[30%] justify-center
                    px-2 rounded-md hover:bg-[#006BFF] transition-all cursor-pointer font-sans text-sm"
                onClick={handleCopy}
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
        <div className="flex flex-col justify-center items-center gap-4">
          <h1 className="text-[#0D92F4] text-3xl font-bold font-sans">
            Shareable Link
          </h1>
          <div>
            <button
              className="bg-[#0D92F4] text-white text-normal gap-2
                font-semibold font-sans px-4 py-2.5 rounded-md flex items-baseline
                cursor-pointer hover:bg-[#006BFF] transition-all"
              onClick={handleShareAbleLink}
            >
              <GoPaperclip className="translate-y-0.5"></GoPaperclip>
              Export To Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
