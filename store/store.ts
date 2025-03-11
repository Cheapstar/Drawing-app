import { TOOL } from "../types/types";
import { atom } from "jotai";

export const colorAtom = atom<string>("#1e1e1e");

export const strokeWidthAtom = atom<number>(16);
export const fontSizeAtom = atom<number>(32);
export const fontFamilyAtom = atom<string>("virgilFont");
export const toolAtom = atom<TOOL>("select");

export const darkModeAtom = atom<boolean>(false);
