import { CollaborativeWhiteboard } from "@/components/WhiteBoardCollab";
import { Suspense } from "react";

export default function CollabWhiteBoard() {
  return (
    <main>
      <Suspense>
        <CollaborativeWhiteboard></CollaborativeWhiteboard>
      </Suspense>
    </main>
  );
}
