"use client";

import dynamic from "next/dynamic";
import { Command } from "@phosphor-icons/react";
import { useState } from "react";

const V5Terminal = dynamic(() => import("./v5-terminal").then((module) => module.V5Terminal), { ssr: false });

export function V5TerminalLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="v5-button quiet" onClick={() => setOpen(true)} aria-expanded={open}>
        <Command aria-hidden size={17} /> Open the small terminal
      </button>
      {open ? <V5Terminal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
