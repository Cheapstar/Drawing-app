import { TOOL } from "@/components/WhiteBoard";
import { atom } from "jotai";

export const colorAtom = atom<string>("#1e1e1e");

export const strokeWidthAtom = atom<number>(16);
export const fontSizeAtom = atom<number>(32);
export const fontFamilyAtom = atom<string>("virgilFont");
export const toolAtom = atom<TOOL>("select");
