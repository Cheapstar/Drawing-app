import { useState } from "react";
import { Element } from "@/types/types";

export type HistoryState = Element[];
export type SetHistoryState = (
  action: ((prevState: HistoryState) => HistoryState) | HistoryState,
  overWrite?: boolean
) => void;

export const useHistory = (
  initialState: HistoryState = []
): [HistoryState, SetHistoryState, () => void, () => void] => {
  const [index, setIndex] = useState<number>(0);
  const [history, setHistory] = useState<HistoryState[]>([initialState]);

  const setState: SetHistoryState = (action, overWrite = false) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;

    if (overWrite) {
      const newHistory = [...history];
      newHistory[index] = newState;
      setHistory(newHistory);
    } else {
      const newHistory = [...history].slice(0, index + 1);
      setHistory([...newHistory, newState]);
      setIndex((prevState) => prevState + 1);
    }
  };

  const undo = () => {
    if (index > 0) {
      const newIndex = index - 1;
      const prevElements = history[newIndex];

      // Restore opacity if needed
      prevElements.forEach((element) => {
        element.opacity = 1;
      });

      // First update the index
      setIndex(newIndex);

      // Then update the state with overwrite
      setState(prevElements, true);
    }
  };
  const redo = () =>
    index < history.length - 1 && setIndex((prevState) => prevState + 1);

  return [history[index] || [], setState, undo, redo];
};
