import { atomWithStorage } from "jotai/utils";
import { TOOL } from "../types/types";
import { atom } from "jotai";
import { WebSocketClient } from "@/WebSocketClient";

export const colorAtom = atom<string>("#1e1e1e");

export const strokeWidthAtom = atom<number>(16);
export const fontSizeAtom = atom<number>(32);
export const fontFamilyAtom = atom<string>("virgilFont");
export const toolAtom = atom<TOOL>("select");

export const showShareModalAtom = atom<boolean>(false);

export const darkModeAtom = atomWithStorage<boolean>("dark-mode-x-draw", false);

export const roomIdAtom = atom<string>("");
export const socketAtom = atom<WebSocketClient>();
export const collabNameAtom = atom<string>("");
