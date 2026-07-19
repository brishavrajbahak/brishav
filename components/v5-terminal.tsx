"use client";

import { X } from "@phosphor-icons/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { projects, siteConfig } from "@/lib/content";

const help = ["help", "whoami", "projects", "skills", "method"];

function answer(command: string) {
  const normalized = command.trim().toLowerCase();
  if (normalized === "help") return `Try: ${help.join(", ")}`;
  if (normalized === "whoami") return `${siteConfig.name}. Undergraduate student and data analyst in progress.`;
  if (normalized === "projects") return projects.map((project) => `${project.number} ${project.title} — ${project.status}`).join("\n");
  if (normalized === "skills") return "Python / SQL / Power BI / Cloudflare";
  if (normalized === "method") return "Check the cohort. Keep the denominator visible. Publish only what exists.";
  return `I don't have a command called “${command}”. Type help.`;
}

export function V5Terminal({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<Array<{ command: string; output: string }>>([
    { command: "whoami", output: answer("whoami") }
  ]);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const command = input.trim();
    if (!command) return;
    setEntries((current) => [...current, { command, output: answer(command) }].slice(-8));
    setInput("");
  }

  return (
    <div className="v5-terminal-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="v5-terminal" role="dialog" aria-modal="true" aria-labelledby="terminal-title">
        <header><div><span>Optional tool</span><h2 id="terminal-title">A small terminal</h2></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close terminal"><X aria-hidden size={20} /></button></header>
        <div className="v5-terminal-log" aria-live="polite">
          {entries.map((entry, index) => <div key={`${entry.command}-${index}`}><p><span>brishav:~$</span> {entry.command}</p><pre>{entry.output}</pre></div>)}
        </div>
        <form onSubmit={submit}>
          <label htmlFor="v5-terminal-command">Command</label>
          <div><span aria-hidden>brishav:~$</span><input id="v5-terminal-command" value={input} onChange={(event) => setInput(event.target.value)} autoComplete="off" placeholder="help" /></div>
        </form>
        <div className="v5-terminal-shortcuts" aria-label="Command shortcuts">
          {help.map((command) => <button key={command} type="button" onClick={() => setInput(command)}>{command}</button>)}
        </div>
      </section>
    </div>
  );
}
