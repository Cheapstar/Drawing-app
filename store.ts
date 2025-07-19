import { atom } from "jotai";
import { AppState } from "./types";
import { defaultAppState } from "./Constants";

export const appStateAtom = atom<AppState>(defaultAppState);
