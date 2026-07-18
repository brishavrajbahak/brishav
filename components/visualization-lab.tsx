"use client";

import dynamic from "next/dynamic";
import { ArrowClockwise, ChartBar, Database, GlobeHemisphereWest, Pulse } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { SceneQuality } from "@/lib/adaptive-quality";
import { fadeUp } from "@/lib/motion";
import { GlobePoster } from "./scene-posters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const DataChart = dynamic(() => import("./data-chart").then((module) => module.DataChart), {
  ssr: false,
  loading: () => <div className="chart-skeleton" role="status" aria-label="Loading chart" />
});

const GlobeSceneExperience = dynamic(
  () => import("./scene-experiences").then((module) => module.GlobeSceneExperience),
  { ssr: false }
);

type LabMode = AnalysisMode | "globe";

export function VisualizationLab({ quality }: { quality: SceneQuality }) {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<LabMode>("overview");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (!selectedId) return;
    const controller = new AbortController();
    const analysisMode: AnalysisMode = mode === "globe" ? "overview" : mode;
    queueMicrotask(() => {
      setLoading(true);
      setError("");
    });
    analyzeDataset(selectedId, analysisMode, controller.signal)
      .then((analysis) => {
        setResult(analysis);
        void sendAnalyticsEvent("analyze_run", { datasetId: selectedId, analysisType: analysisMode });
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        const message = cause instanceof PortfolioApiError ? cause.message : "The analysis request could not be completed.";
        setError(message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [selectedId, mode]);

  const presentation = useMemo(() => {
    if (!result || mode === "globe") return null;
    return derivePresentation(result, mode);
  }, [result, mode]);

  const selectedDataset = datasets.find((dataset) => dataset.id === selectedId);

  return (
    <section id="laboratory" className="section lab-section section-anchor" aria-labelledby="lab-title">
      <motion.div className="section-heading split-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp}>
        <div>
          <span className="section-index">04 / Visualization laboratory</span>
          <h2 id="lab-title">Explore the same evidence through different analytical lenses.</h2>
        </div>
        <p>The backend contract stays fixed. The frontend derives visibly different distribution and comparison views from returned records.</p>
      </motion.div>

      <div className="lab-shell">
        <div className="dataset-rail" role="group" aria-label="Available datasets">
          <div className="dataset-rail-heading"><Database aria-hidden size={19} /><span>Dataset signal</span></div>
          {loading && datasets.length === 0 ? <div className="dataset-loading">Loading catalog…</div> : null}
          {datasets.map((dataset) => (
            <button
              type="button"
              key={dataset.id}
              className={selectedId === dataset.id ? "active" : ""}
              aria-pressed={selectedId === dataset.id}
              onClick={() => setSelectedId(dataset.id)}
            >
              <small>{dataset.theme}</small>
              <strong>{dataset.label}</strong>
              <span>{dataset.description}</span>
            </button>
          ))}
          {error && datasets.length === 0 ? (
            <div className="lab-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => void loadCatalog()}><ArrowClockwise aria-hidden size={16} /> Retry catalog</button>
            </div>
          ) : null}
        </div>

        <div className="analysis-stage">
          <div className="analysis-toolbar">
            <div>
              <span className="micro-label">Live demo / curated data</span>
              <h3>{selectedDataset?.label || "Awaiting dataset"}</h3>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="quality-badge"><Pulse aria-hidden size={15} /> {quality} scene</span>
              </TooltipTrigger>
              <TooltipContent>Adaptive quality protects motion and performance preferences.</TooltipContent>
            </Tooltip>
          </div>

          <Tabs
            value={mode}
            onValueChange={(value) => {
              const nextMode = value as LabMode;
              setMode(nextMode);
              void sendAnalyticsEvent(nextMode === "globe" ? "mandala_view" : "playground_open", { source: "visual-lab", mode: nextMode });
            }}
          >
            <TabsList aria-label="Analysis mode">
              <TabsTrigger value="overview"><ChartBar aria-hidden size={16} /> Overview</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="trend">Trend / comparison</TabsTrigger>
              <TabsTrigger value="globe"><GlobeHemisphereWest aria-hidden size={16} /> Dataset globe</TabsTrigger>
            </TabsList>

            {(["overview", "distribution", "trend"] as AnalysisMode[]).map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="chart-panel" aria-busy={loading}>
                  <div className="chart-heading">
                    <div>
                      <span>{presentation?.eyebrow || "Preparing view"}</span>
                      <h4>{presentation?.title || "Loading analytical signal"}</h4>
                    </div>
                    {loading ? <CircleLoader /> : null}
                  </div>
                  <div className="chart-frame">
                    {presentation && !loading ? <DataChart presentation={presentation} /> : <div className="chart-skeleton" />}
                  </div>
                </div>
              </TabsContent>
            ))}

            <TabsContent value="globe">
              <div className="globe-panel">
                {quality === "poster" ? (
                  <div className="globe-scene" role="img" aria-label="Dataset globe. Static reduced-motion view.">
                    <GlobePoster />
                  </div>
                ) : (
                  <GlobeSceneExperience
                    quality={quality}
                    datasetIds={datasets.map((dataset) => dataset.id)}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                )}
                <div className="globe-copy">
                  <span>Selected signal</span>
                  <h4>{selectedDataset?.theme || "Dataset"}</h4>
                  <p>{selectedDataset?.description}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && datasets.length > 0 ? <div className="inline-error" role="alert">{error}</div> : null}
          {result ? (
            <>
            <div className="metric-grid" role="group" aria-label="Analysis metrics">
                {result.metrics.map((metric) => (
                  <article key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <p>{metric.note}</p>
                  </article>
                ))}
              </div>
              <div className="analysis-narrative">
                <div><span>Readout</span><p>{result.summary}</p></div>
                <div><span>Signal worth noticing</span><p>{result.surpriseInsight}</p></div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CircleLoader() {
  return <span className="circle-loader" role="status" aria-label="Refreshing analysis" />;
}
