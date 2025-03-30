import { WhiteBoard } from "@/components/WhiteBoard";
import { Suspense } from "react";

export default function Home() {
  return (
    <main>
      <Suspense>
        <WhiteBoard></WhiteBoard>
      </Suspense>
    </main>
  );
}
