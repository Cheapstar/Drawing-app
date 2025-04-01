"use client";
import { TOOL } from "@/types/types";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

// Modify the SvgWrapper component
export function useSvg({ tool }: { tool: TOOL }) {
  const linesRef = useRef<number[][][]>([]);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fadeTimerRef = useRef<gsap.core.Tween | null>(null);
  const eraserRef = useRef<number[][]>([]);

  useEffect(() => {
    if (svgRef.current) {
      if (tool === "laser") {
        svgRef.current.innerHTML = "";
        svgRef.current.innerHTML = `
                <defs>
                <filter id="glow" x="-50%" y="-50%" height="500%" width="500%">
                <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
                </filter>
                <filter id="goo">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo" />
                <feBlend in="SourceGraphic" in2="goo" />
                </filter>
                </defs>
                <path  id='path'  fill='none' stroke='#F7374F' stroke-width='25'  filter="url(#glow)" ></path>
                <path  id='path2' fill='none' stroke='#fff' stroke-linejoin="round" stroke-width='20' stroke-linecap='round' filter="url(#goo)" ></path>
            `;
      }

      if (tool === "eraser") {
        if (svgRef.current) {
          svgRef.current.innerHTML = "";
          svgRef.current.innerHTML = `
                  <path  id='path' fill='none' stroke='rgba(0, 0, 0, 0.25)' 
                  stroke-linejoin="round" stroke-width='15' stroke-linecap='round' filter="url(#goo)" ></path>
              `;
        }
      }
    }
  }, [tool]);

  useEffect(() => {
    gsap.ticker.fps(50);
    gsap.ticker.add(() => {
      if (linesRef.current.length > 0) {
        updateLaser();
      }
    });

    gsap.ticker.add(() => {
      if (eraserRef.current.length > 1) {
        const pointsToRemove = Math.max(
          1,
          Math.floor(eraserRef.current.length / 10)
        );
        eraserRef.current.splice(0, pointsToRemove);
        updateEraser();
      }
    });
    return () => {
      if (fadeTimerRef.current) {
        fadeTimerRef.current.kill();
      }
    };
  }, []);

  function createNewLaserLine() {
    linesRef.current.push([]);
    const lineIndex = linesRef.current.length - 1;

    if (svgRef.current) {
      const newIndex = lineIndex;

      // Create glow path
      const path1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path1.id = `path-${newIndex}`;
      path1.setAttribute("fill", "none");
      path1.setAttribute("stroke", "#F7374F");
      path1.setAttribute("stroke-width", "25");
      path1.setAttribute("filter", "url(#glow)");
      path1.setAttribute("opacity", "1"); // Set initial opacity to 1

      // Create white inner path
      const path2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path2.id = `path2-${newIndex}`;
      path2.setAttribute("fill", "none");
      path2.setAttribute("stroke", "#fff");
      path2.setAttribute("stroke-linejoin", "round");
      path2.setAttribute("stroke-width", "20");
      path2.setAttribute("stroke-linecap", "round");
      path2.setAttribute("filter", "url(#goo)");
      path2.setAttribute("opacity", "1"); // Set initial opacity to 1

      svgRef.current.appendChild(path1);
      svgRef.current.appendChild(path2);
    }
  }

  function updateLaser() {
    for (let i = 0; i < linesRef.current.length; i++) {
      if (!linesRef.current[i] || linesRef.current[i].length === 0) continue;

      const path1 = document.getElementById(`path-${i}`);
      const path2 = document.getElementById(`path2-${i}`);

      if (path1 && path2) {
        const pathData = "M" + linesRef.current[i].join(" ");
        path1.setAttribute("d", pathData);
        path2.setAttribute("d", pathData);
      }
    }
  }

  function startFadingLaser() {
    // If there's already a fade animation running, kill it
    if (fadeTimerRef.current) {
      fadeTimerRef.current.kill();
    }

    for (let i = 0; i < linesRef.current.length; i++) {
      const path1 = document.getElementById(`path-${i}`);
      const path2 = document.getElementById(`path2-${i}`);

      if (path1 && path2) {
        path1.setAttribute("opacity", "1");
        path2.setAttribute("opacity", "1");

        gsap.to([path1, path2], {
          opacity: 0,
          duration: 8,
          ease: "power3.out",
          onComplete: () => {
            if (path1.parentNode) path1.parentNode.removeChild(path1);
            if (path2.parentNode) path2.parentNode.removeChild(path2);

            linesRef.current[i] = [];
          },
        });
      }
    }
  }

  function updateEraser() {
    const path = document.getElementById(`path`);
    if (path) {
      const pathData = "M" + eraserRef.current.join(" ");
      path.setAttribute("d", pathData);
    }
  }

  function handleSvgPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    setIsClicked(true);
    if (tool === "laser") {
      createNewLaserLine();

      if (fadeTimerRef.current) {
        fadeTimerRef.current.kill();
        fadeTimerRef.current = null;
      }
    }
  }

  function handleSvgPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isClicked) {
      if (tool === "laser") {
        if (linesRef.current.length === 0) {
          linesRef.current.push([[event.clientX, event.clientY]]);
          return;
        }

        linesRef.current[linesRef.current.length - 1].push([
          event.clientX,
          event.clientY,
        ]);

        updateLaser();
      }

      if (tool === "eraser") {
        eraserRef.current.push([event.clientX, event.clientY]);
        if (eraserRef.current.length > 10) {
          eraserRef.current.shift();
        }
        updateEraser();
      }
    }
  }

  function handleSvgPointerUp() {
    setIsClicked(false);
    // Start fading the laser paths when pointer is up
    if (tool === "laser") {
      startFadingLaser();
    }
  }

  return {
    svgRef,
    handleSvgPointerDown,
    handleSvgPointerMove,
    handleSvgPointerUp,
  };
}
