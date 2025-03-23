import { useCallback, useEffect, useState } from "react";
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
    setHistory((prevHistory) => {
      const newState =
        typeof action === "function" ? action(prevHistory[index]) : action;
      if (overWrite) {
        const newHistory = [...prevHistory];
        newHistory[index] = newState;
        return newHistory;
      } else {
        const newHistory = [...prevHistory].slice(0, index + 1);
        return [...newHistory, newState];
      }
    });

    if (!overWrite) {
      setIndex((prevIndex) => prevIndex + 1);
    }
  };

  const undo = () => {
    if (index > 0) {
      setIndex((prevIndex) => prevIndex - 1);
    }
  };

  const redo = () => {
    setIndex((prevIndex) => {
      if (prevIndex < history.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
  };

  const handleKeyActions = useCallback(
    (event: KeyboardEvent) => {
      event.stopPropagation();
      event.preventDefault(); // Prevent default undo/redo behavior

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        redo();
      }
    },
    [undo, redo]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyActions);
    return () => {
      window.removeEventListener("keydown", handleKeyActions);
    };
  }, [handleKeyActions]);

  return [history[index] || [], setState, undo, redo];
};
