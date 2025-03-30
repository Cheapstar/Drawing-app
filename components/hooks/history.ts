import { useCallback, useEffect, useState } from "react";
import { Element } from "@/types/types";
import { loadElementsFromStorage, saveElementsIntoStorage } from "@/storage";
import { useSearchParams } from "next/navigation";

export type HistoryState = Element[];
export type SetHistoryState = (
  action: ((prevState: HistoryState) => HistoryState) | HistoryState,
  overWrite?: boolean
) => void;

export const useHistory = (initialState: HistoryState = []) => {
  const [index, setIndex] = useState<number>(0);
  const [history, setHistory] = useState<HistoryState[]>([initialState]);
  const [loadingSavedElements, setLoadingSavedElements] =
    useState<boolean>(true);

  const searchParams = useSearchParams();

  const setState: SetHistoryState = (action, overWrite = false) => {
    setHistory((prevHistory) => {
      const newState =
        typeof action === "function" ? action(prevHistory[index]) : action;

      saveElementsIntoStorage(newState);

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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault(); // Prevent default undo/redo behavior
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault(); // Prevent default undo/redo behavior
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

  useEffect(() => {
    console.log("Loading FRom Local Storage");

    const savedElements = loadElementsFromStorage();

    if (!savedElements || searchParams.get("id")) {
      return;
    }

    setState(savedElements);
    console.log("Loaded From Local Storage", savedElements);
  }, []);

  return {
    elements: history[index] || [],
    setElements: setState,
    undo,
    redo,
    loadingSavedElements,
    setLoadingSavedElements,
  };
};
