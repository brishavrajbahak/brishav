"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/content";

const SignalMandala = dynamic(
  () => import("./v5-signal-mandala").then((module) => module.V5SignalMandala),
  { ssr: false }
);

export function V5MandalaLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: "320px 0px" }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="v5-mandala-slot">
      {ready ? <SignalMandala /> : (
        <div className="v5-mandala-fallback" role="status">
          <span>Project map</span>
          <strong>Four projects. One relationship map.</strong>
          <p>{projects.map((project) => project.title).join(" / ")}</p>
        </div>
      )}
    </div>
  );
}
