import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Target, Filter, ChevronRight, Crosshair,
  ArrowDownRight, Layers, Cpu,
} from "lucide-react";
import { PageShell } from "@/components/aqualoop/page-shell";
import { PageHeader } from "@/components/aqualoop/page-header";
import { StatCard } from "@/components/aqualoop/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { generateNetworkTopology, generateLeakEvents, type CandidatePipe } from "@/lib/hydrotrace";

export const Route = createFileRoute("/localization")({
  head: () => ({
    meta: [
      { title: "Leak Localization | HydroTrace" },
      { name: "description", content: "Brain 2 — Narrow 900+ pipes to top candidates using topology + hydraulic fingerprints." },
    ],
  }),
  component: LocalizationPage,
});

function LocalizationPage() {
  const { nodes, pipes } = useMemo(() => generateNetworkTopology(), []);
  const leakEvents = useMemo(() => generateLeakEvents(5), []);
  const [selectedEvent, setSelectedEvent] = useState(0);
  const event = leakEvents[selectedEvent]!;

  // Simulate "leak zone" — highlight a region of the network
  const leakZoneCenter = { x: 280, y: 220 };
  const leakZoneRadius = 140;

  const highlightedNodes = useMemo(() => {
    return nodes.map((n) => {
      const dist = Math.sqrt(
        (n.x - leakZoneCenter.x) ** 2 + (n.y - leakZoneCenter.y) ** 2,
      );
      const inZone = dist < leakZoneRadius;
      return { ...n, anomaly: inZone ? Math.max(0, 1 - dist / leakZoneRadius) : 0 };
    });
  }, [nodes]);

  const highlightedPipes = useMemo(() => {
    const zoneNodeIds = new Set(
      highlightedNodes.filter((n) => n.anomaly > 0.3).map((n) => n.id),
    );
    return pipes.map((p) => {
      const inZone = zoneNodeIds.has(p.from) || zoneNodeIds.has(p.to);
      const isLeak = p.id === event.topCandidates[0]?.pipeId;
      return {
        ...p,
        status: isLeak ? ("leaking" as const) : inZone ? ("suspect" as const) : ("normal" as const),
        leakScore: isLeak ? 0.95 : inZone ? Math.random() * 0.6 : 0,
      };
    });
  }, [pipes, highlightedNodes, event]);

  const suspectCount = highlightedPipes.filter((p) => p.status !== "normal").length;

  return (
    <PageShell>
      <PageHeader
        title="Brain 2 — Leak Localization"
        subtitle="Uses network topology + hydraulic fingerprint matching to narrow 900+ pipes down to top candidates."
        actions={
          <div className="flex gap-2 flex-wrap">
            {leakEvents.map((e, i) => (
              <Button
                key={e.id}
                size="sm"
                variant={i === selectedEvent ? "default" : "outline"}
                onClick={() => setSelectedEvent(i)}
              >
                {e.id}
              </Button>
            ))}
          </div>
        }
      />

      {/* Funnel Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Layers} label="Total Pipes" value={pipes.length} hint="Full L-Town network" />
        <StatCard
          icon={Filter}
          label="Candidate Zone"
          value={suspectCount}
          hint="Pipes in anomalous region"
          tone="warn"
        />
        <StatCard
          icon={Target}
          label="Top Candidate"
          value={event.topCandidates[0]?.pipeId ?? "—"}
          hint={`Match score: ${event.topCandidates[0]?.matchScore ?? 0}`}
          tone="good"
        />
        <StatCard
          icon={Crosshair}
          label="Leak Area"
          value={event.area}
          hint={`Severity: ${event.severity}`}
          tone={event.severity === "critical" ? "bad" : event.severity === "high" ? "warn" : "default"}
        />
      </div>

      {/* Narrowing Funnel Visualization */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 card-soft p-6"
      >
        <h3 className="text-base font-semibold mb-5">Localization Funnel</h3>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { label: "All Pipes", count: pipes.length, color: "bg-muted", text: "text-muted-foreground" },
            { label: "Anomalous Region", count: suspectCount, color: "bg-amber-500/15", text: "text-amber-600" },
            { label: "Fingerprint Candidates", count: event.topCandidates.length, color: "bg-blue-500/15", text: "text-blue-600" },
            { label: "Top Match", count: 1, color: "bg-emerald-500/15", text: "text-emerald-600" },
          ].map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15 }}
                className={`rounded-2xl border ${stage.color} px-5 py-4 text-center min-w-[130px]`}
              >
                <p className={`text-2xl font-bold font-display ${stage.text}`}>{stage.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stage.label}</p>
              </motion.div>
              {i < 3 && <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </motion.section>

      {/* Network Map SVG */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 card-soft p-5 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Network Topology — L-Town</h3>
            <p className="text-sm text-muted-foreground">
              {pipes.length} pipes · {nodes.length} junctions · highlighted zone = candidate region
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Suspect
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Leak
            </span>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 920 640"
            className="w-full min-w-[700px]"
            style={{ maxHeight: "500px" }}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" strokeWidth="0.5" opacity="0.4" />
              </pattern>
              <radialGradient id="zoneGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.06" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="920" height="640" fill="url(#grid)" />

            {/* Leak zone highlight */}
            <circle
              cx={leakZoneCenter.x}
              cy={leakZoneCenter.y}
              r={leakZoneRadius}
              fill="url(#zoneGlow)"
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.8"
            />

            {/* Pipes */}
            {highlightedPipes.map((p) => {
              const fromNode = highlightedNodes.find((n) => n.id === p.from);
              const toNode = highlightedNodes.find((n) => n.id === p.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={p.id}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={
                    p.status === "leaking"
                      ? "#ef4444"
                      : p.status === "suspect"
                        ? "#f59e0b"
                        : "var(--color-border)"
                  }
                  strokeWidth={p.status === "leaking" ? 3 : p.status === "suspect" ? 1.8 : 0.8}
                  opacity={p.status === "normal" ? 0.3 : 0.9}
                />
              );
            })}

            {/* Nodes */}
            {highlightedNodes.map((n) => (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={n.type === "sensor" ? 5 : n.type === "tank" || n.type === "reservoir" ? 7 : 2.5}
                fill={
                  n.type === "sensor"
                    ? n.anomaly > 0.3
                      ? "#ef4444"
                      : "#3b82f6"
                    : n.type === "tank"
                      ? "#06b6d4"
                      : n.type === "reservoir"
                        ? "#8b5cf6"
                        : n.anomaly > 0.5
                          ? "#f59e0b"
                          : "var(--color-muted-foreground)"
                }
                opacity={n.anomaly > 0 ? 0.9 : 0.35}
              />
            ))}

            {/* Sensor labels */}
            {highlightedNodes
              .filter((n) => n.type === "sensor")
              .map((n) => (
                <text
                  key={`label-${n.id}`}
                  x={n.x + 8}
                  y={n.y + 3}
                  fontSize="8"
                  fill={n.anomaly > 0.3 ? "#ef4444" : "#3b82f6"}
                  fontFamily="monospace"
                >
                  {n.id.replace("sensor-", "")}
                </text>
              ))}

            {/* Tank/Reservoir labels */}
            {highlightedNodes
              .filter((n) => n.type === "tank" || n.type === "reservoir")
              .map((n) => (
                <text
                  key={`label-${n.id}`}
                  x={n.x + 10}
                  y={n.y + 4}
                  fontSize="9"
                  fontWeight="bold"
                  fill={n.type === "tank" ? "#06b6d4" : "#8b5cf6"}
                >
                  {n.id}
                </text>
              ))}

            {/* Zone label */}
            <text
              x={leakZoneCenter.x}
              y={leakZoneCenter.y - leakZoneRadius - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#f59e0b"
            >
              ⚠ CANDIDATE ZONE
            </text>
          </svg>
        </div>
      </motion.section>

      {/* Candidate Ranking + Fingerprint */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Candidate Ranking Table */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-soft p-5"
        >
          <h3 className="text-base font-semibold mb-1">Top Candidate Pipes</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ranked by hydraulic fingerprint match score
          </p>
          <div className="space-y-3">
            {event.topCandidates.map((c, i) => (
              <div
                key={c.pipeId}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  i === 0
                    ? "bg-emerald-500/8 border-emerald-500/30"
                    : "bg-card border-border"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full grid place-items-center text-sm font-bold shrink-0 ${
                    i === 0
                      ? "bg-emerald-500 text-white"
                      : i === 1
                        ? "bg-blue-500 text-white"
                        : i === 2
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-sm">{c.pipeId}</p>
                    <Badge variant="secondary" className="text-[10px]">{c.zone}</Badge>
                  </div>
                  <div className="mt-1.5">
                    <Progress value={c.matchScore * 100} className="h-2" />
                  </div>
                </div>
                <p className="font-display text-lg font-bold shrink-0">
                  {Math.round(c.matchScore * 100)}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Hydraulic Fingerprint Comparison */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-soft p-5"
        >
          <h3 className="text-base font-semibold mb-1">Hydraulic Fingerprint Comparison</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Simulated pressure drop vs. observed event
          </p>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground border-b border-border pb-2">
              <span>Sensor</span>
              <span className="text-center">Observed Δ</span>
              <span className="text-center">Predicted Δ</span>
              <span className="text-center">Error</span>
            </div>
            {["n1", "n4", "n31", "n54", "n105", "n114", "n163", "n188"].map((sensor) => {
              const observed = -(3 + Math.random() * 10);
              const predicted = observed + (Math.random() - 0.5) * 3;
              const error = Math.abs(observed - predicted);
              return (
                <div
                  key={sensor}
                  className="grid grid-cols-4 gap-2 text-sm py-1.5 border-b border-border/50"
                >
                  <span className="font-mono text-xs">{sensor}</span>
                  <span className="text-center text-red-500 font-medium">
                    {observed.toFixed(1)}
                  </span>
                  <span className="text-center text-blue-500 font-medium">
                    {predicted.toFixed(1)}
                  </span>
                  <span
                    className={`text-center font-medium ${
                      error < 1.5 ? "text-emerald-500" : "text-amber-500"
                    }`}
                  >
                    {error.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Method:</strong> For each candidate pipe, WNTR simulates
              what pressure readings would look like if that pipe leaked. The candidate whose simulated
              fingerprint most closely matches the observed event gets the highest score.
            </p>
          </div>
        </motion.section>
      </div>

      {/* How It Works */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 card-soft p-5"
      >
        <h3 className="text-base font-semibold mb-4">Localization Pipeline</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            {
              icon: Layers,
              title: "Full Network",
              desc: `${pipes.length} pipes loaded from L-TOWN.inp`,
              color: "text-muted-foreground bg-muted",
            },
            {
              icon: MapPin,
              title: "Sensor Anomalies",
              desc: "Identify which pressure sensors dropped",
              color: "text-amber-600 bg-amber-500/15",
            },
            {
              icon: Cpu,
              title: "WNTR Simulation",
              desc: `Simulate leaks for ${suspectCount} candidate pipes`,
              color: "text-blue-600 bg-blue-500/15",
            },
            {
              icon: Target,
              title: "Top Match",
              desc: `${event.topCandidates[0]?.pipeId} — score ${event.topCandidates[0]?.matchScore}`,
              color: "text-emerald-600 bg-emerald-500/15",
            },
          ].map((s, i) => (
            <div key={s.title} className="flex items-start gap-3">
              {i > 0 && (
                <ArrowDownRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 hidden sm:block" />
              )}
              <div className={`rounded-xl border p-4 flex-1`}>
                <div className={`h-8 w-8 rounded-lg grid place-items-center ${s.color} mb-2`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>
    </PageShell>
  );
}
