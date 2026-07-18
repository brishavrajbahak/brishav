"use client";

import dynamic from "next/dynamic";
import {
  ArrowClockwise,
  ChartBar,
  Command,
  Database,
  GlobeHemisphereWest,
  Pulse,
  SpeakerHigh,
  SpeakerSlash
} from "@phosphor-icons/react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear } from "d3";
import mandalaConfig from "@/public/assets/data/mandala-config.json";
import { derivePresentation } from "@/lib/analysis";
import {
  analyzeDataset,
  getDatasets,
  PortfolioApiError,
  sendAnalyticsEvent,
  type AnalysisMode,
  type AnalysisResult,
  type DatasetSummary
} from "@/lib/api";
import type { ExperienceTier } from "@/lib/cinematic";
import { runTerminalCommand } from "@/lib/terminal";
import { DataChart } from "./data-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const DatasetGlobeV3 = dynamic(() => import("./dataset-globe-v3").then((module) => module.DatasetGlobeV3), {
  ssr: false,
  loading: () => <div className="v3-globe-loading" role="status">Preparing the dataset atlas…</div>
});

type ControlMode = AnalysisMode | "globe";
type TerminalEntry = { id: number; command?: string; lines: string[] };

export function DataControlRoom({ tier }: { tier: ExperienceTier }) {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<ControlMode>("overview");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clock, setClock] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mandalaFocus, setMandalaFocus] = useState("brishav");
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    { id: 0, lines: ["Himalayan Observatory terminal online.", "Type help to inspect the shared data system."] }
  ]);
  const terminalLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("observatory-control-ready"));
  }, []);

  const loadCatalog = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    try {
      const catalog = await getDatasets(controller.signal);
      setDatasets(catalog);
      setSelectedId((current) => current || catalog[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The dataset catalog could not be loaded.");
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadCatalog());
  }, [loadCatalog]);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const update = () => setClock(formatter.format(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedId || mode === "globe") return;
    const controller = new AbortController();
    queueMicrotask(() => {
      setLoading(true);
      setError("");
    });
    analyzeDataset(selectedId, mode, controller.signal)
      .then((analysis) => {
        setResult(analysis);
        setMandalaFocus(analysis.mandalaFocus[0] || selectedId);
        void sendAnalyticsEvent("analyze_run", { datasetId: selectedId, analysisType: mode });
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof PortfolioApiError ? cause.message : "The analysis request could not be completed.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedId, mode]);

  useEffect(() => {
    terminalLogRef.current?.scrollTo({ top: terminalLogRef.current.scrollHeight });
  }, [terminalEntries]);

  const selectedDataset = datasets.find((dataset) => dataset.id === selectedId);
  const presentation = useMemo(() => {
    if (!result || mode === "globe") return null;
    return derivePresentation(result, mode);
  }, [result, mode]);

  function runCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const command = terminalInput.trim();
    if (!command) return;
    const response = runTerminalCommand(command);
    setTerminalEntries((current) => [...current, { id: Date.now(), command, lines: response.lines }].slice(-12));
    setTerminalInput("");
    void sendAnalyticsEvent("terminal_command", { command: command.split(/\s+/)[0] || "unknown" });
    if (response.action.type === "focus-mandala") {
      setMandalaFocus("brishav");
      document.querySelector<HTMLElement>(".v3-mandala-panel")?.focus();
    }
    if (response.action.type === "select-dataset") {
      setSelectedId(response.action.datasetId);
      if (response.action.mode) setMode(response.action.mode);
    }
    if (response.action.type === "select-project") {
      window.dispatchEvent(new CustomEvent("observatory-project-select", { detail: response.action.projectId }));
    }
    if (soundEnabled) playInterfaceTone();
  }

  function selectDataset(id: string) {
    setSelectedId(id);
    setMandalaFocus(id);
    if (soundEnabled) playInterfaceTone();
  }

  return (
    <section className="v3-control-room" aria-labelledby="laboratory-title">
      <div className="v3-control-sequence">
        <div className="v3-control-stage">
          <div className="v3-control-backdrop" aria-hidden>
            <picture>
              <source type="image/avif" srcSet="/assets/cinematic/observatory-workspace-1280.avif 1280w, /assets/cinematic/observatory-workspace-1672.avif 1672w" />
              <img src="/assets/cinematic/observatory-workspace-1280.webp" alt="" width="1672" height="941" loading="lazy" />
            </picture>
          </div>
          <div className="v3-control-overlay" />
          <header className="v3-control-header">
            <div><span>04 / Data control room</span><h2 id="laboratory-title">One signal. Every instrument in sync.</h2></div>
            <div className="v3-control-status">
              <span><i aria-hidden /> NPT {clock || "--:--:--"}</span>
              <button type="button" aria-pressed={soundEnabled} onClick={() => { setSoundEnabled((value) => !value); playInterfaceTone(); }}>
                {soundEnabled ? <SpeakerHigh aria-hidden size={17} /> : <SpeakerSlash aria-hidden size={17} />}
                Interface sound {soundEnabled ? "on" : "off"}
              </button>
            </div>
          </header>

          <div className="v3-control-grid">
            <div className="v3-terminal-panel">
              <div className="v3-panel-label"><Command aria-hidden size={17} /><span>Observatory terminal</span><i>live</i></div>
              <div className="v3-terminal-log" ref={terminalLogRef} aria-live="polite">
                {terminalEntries.map((entry) => (
                  <div key={entry.id}>
                    {entry.command ? <p><span>br@observatory:~$</span> {entry.command}</p> : null}
                    {entry.lines.map((line, index) => <p key={index}>{line}</p>)}
                  </div>
                ))}
              </div>
              <form onSubmit={runCommand}>
                <label htmlFor="terminal-command">Command</label>
                <span aria-hidden>br@observatory:~$</span>
                <input
                  id="terminal-command"
                  value={terminalInput}
                  onChange={(event) => setTerminalInput(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="help"
                />
              </form>
              <div className="v3-terminal-shortcuts" aria-label="Terminal command shortcuts">
                {["help", "projects", "mandala", "analyze loan-risk distribution"].map((command) => (
                  <button key={command} type="button" onClick={() => setTerminalInput(command)}>{command}</button>
                ))}
              </div>
            </div>

            <SignalMandala focus={mandalaFocus} onSelect={setMandalaFocus} />

            <div className="v3-analysis-panel">
              <div className="v3-panel-label"><Pulse aria-hidden size={17} /><span>Live analytical playground</span><i>{tier}</i></div>
              <div className="v3-dataset-switcher" role="group" aria-label="Datasets">
                {datasets.map((dataset) => (
                  <button key={dataset.id} type="button" className={selectedId === dataset.id ? "active" : ""} aria-pressed={selectedId === dataset.id} onClick={() => selectDataset(dataset.id)}>
                    <small>{dataset.theme}</small><strong>{dataset.label}</strong>
                  </button>
                ))}
              </div>
              {error && datasets.length === 0 ? (
                <div className="v3-control-error" role="alert"><p>{error}</p><button type="button" onClick={() => void loadCatalog()}><ArrowClockwise aria-hidden size={15} /> Retry</button></div>
              ) : null}

              <Tabs value={mode} onValueChange={(value) => { setMode(value as ControlMode); void sendAnalyticsEvent(value === "globe" ? "mandala_view" : "playground_open", { source: "control-room", mode: value }); }}>
                <TabsList aria-label="Analysis mode">
                  <TabsTrigger value="overview"><ChartBar aria-hidden size={15} /> Overview</TabsTrigger>
                  <TabsTrigger value="distribution">Distribution</TabsTrigger>
                  <TabsTrigger value="trend">Comparison</TabsTrigger>
                  <TabsTrigger value="globe"><GlobeHemisphereWest aria-hidden size={15} /> Globe</TabsTrigger>
                </TabsList>
                {(["overview", "distribution", "trend"] as AnalysisMode[]).map((tab) => (
                  <TabsContent key={tab} value={tab}>
                    <div className="v3-chart-shell" aria-busy={loading}>
                      <div><span>{presentation?.eyebrow || "Preparing view"}</span><h3>{presentation?.title || selectedDataset?.label || "Loading analytical signal"}</h3></div>
                      <div className="v3-chart-frame">{presentation && !loading ? <DataChart presentation={presentation} /> : <div className="chart-skeleton" />}</div>
                    </div>
                  </TabsContent>
                ))}
                <TabsContent value="globe">
                  <div className="v3-globe-shell">
                    <DatasetGlobeV3 tier={tier} datasetIds={datasets.map((dataset) => dataset.id)} selectedId={selectedId} onSelect={selectDataset} />
                    <div><span>Selected signal</span><strong>{selectedDataset?.theme || "Dataset atlas"}</strong><p>{selectedDataset?.description}</p></div>
                  </div>
                </TabsContent>
              </Tabs>

              {error && datasets.length > 0 ? <p className="v3-inline-error" role="alert">{error}</p> : null}
              {result ? (
                <div className="v3-metric-strip" aria-label="Analysis metrics">
                  {result.metrics.slice(0, 3).map((metric) => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalMandala({ focus, onSelect }: { focus: string; onSelect: (id: string) => void }) {
  const nodes = useMemo(() => layoutMandala(), []);
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  return (
    <div className="v3-mandala-panel" tabIndex={-1}>
      <div className="v3-panel-label"><Database aria-hidden size={17} /><span>Signal mandala</span><i>{focus}</i></div>
      <svg viewBox="0 0 520 520" role="group" aria-labelledby="mandala-title mandala-description">
        <title id="mandala-title">Brishav analytical signal mandala</title>
        <desc id="mandala-description">A selectable relationship map connecting skills, tools, and data domains.</desc>
        <g className="mandala-rings" aria-hidden>{[78, 142, 208].map((radius) => <circle key={radius} cx="260" cy="260" r={radius} />)}</g>
        <g className="mandala-links" aria-hidden>
          {mandalaConfig.relationships.map((relationship) => {
            const from = nodeMap.get(relationship.from);
            const to = nodeMap.get(relationship.to);
            if (!from || !to) return null;
            return <line key={`${relationship.from}-${relationship.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={focus === relationship.from || focus === relationship.to ? "active" : ""} />;
          })}
        </g>
        <g className="mandala-nodes">
          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x} ${node.y})`} className={focus === node.id ? "active" : ""} role="button" tabIndex={0} aria-label={`${node.label}: ${node.summary}`} onClick={() => onSelect(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(node.id); }}>
              <circle r={node.group === "core" ? 28 : 15} />
              <text y={node.group === "core" ? 44 : 30} textAnchor="middle">{node.label}</text>
            </g>
          ))}
        </g>
      </svg>
      <p>{mandalaConfig.nodes.find((node) => node.id === focus)?.summary || "Select a signal node to inspect its relationship."}</p>
    </div>
  );
}

function layoutMandala() {
  const radii: Record<string, number> = { core: 0, skills: 78, tools: 142, domains: 208 };
  const byGroup = new Map<string, typeof mandalaConfig.nodes>();
  mandalaConfig.nodes.forEach((node) => byGroup.set(node.group, [...(byGroup.get(node.group) || []), node]));
  return mandalaConfig.nodes.map((node) => {
    const group = byGroup.get(node.group) || [node];
    const angles = scaleLinear().domain([0, group.length]).range([-Math.PI / 2, Math.PI * 1.5]);
    const angle = angles(group.indexOf(node));
    const radius = radii[node.group] || 0;
    return { ...node, x: 260 + Math.cos(angle) * radius, y: 260 + Math.sin(angle) * radius };
  });
}

function playInterfaceTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(420, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(620, context.currentTime + 0.07);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.09);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.1);
    oscillator.addEventListener("ended", () => void context.close(), { once: true });
  } catch {
    // Sound feedback is optional and must never interrupt the interface.
  }
}
