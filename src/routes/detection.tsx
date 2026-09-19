import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, CheckCircle2, Radio, TrendingDown,
  TrendingUp, Zap, Shield, Eye, Timer,
} from "lucide-react";
import { PageShell } from "@/components/aqualoop/page-shell";
import { PageHeader } from "@/components/aqualoop/page-header";
import { StatCard } from "@/components/aqualoop/stat-card";
import { ChartCard, TrendLines, TrendArea } from "@/components/aqualoop/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PRESSURE_SENSORS,
  FLOW_SENSORS,
  generateLiveSensorSnapshot,
  type LiveSensorState,
} from "@/lib/hydrotrace";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Leak Detection | HydroTrace" },
      { name: "description", content: "Brain 1 — Real-time anomaly detection across pressure and flow sensors." },
    ],
  }),
  component: DetectionPage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function statusColor(s: string) {
  if (s === "leak_detected") return "text-red-500";
  if (s === "warning") return "text-amber-500";
  return "text-emerald-500";
}
function statusBg(s: string) {
  if (s === "leak_detected") return "bg-red-500/10 border-red-500/30";
  if (s === "warning") return "bg-amber-500/10 border-amber-500/30";
  return "bg-emerald-500/10 border-emerald-500/30";
}
function statusLabel(s: string) {
  if (s === "leak_detected") return "LEAK DETECTED";
  if (s === "warning") return "WARNING — ANOMALY DETECTED";
  return "SYSTEM NORMAL";
}
function statusIcon(s: string) {
  if (s === "leak_detected") return AlertTriangle;
  if (s === "warning") return Eye;
  return Shield;
}

// ─── Component ───────────────────────────────────────────────────────────────
function DetectionPage() {
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [leakActive, setLeakActive] = useState(false);
  const [historyData, setHistoryData] = useState<
    { label: string; probability: number; anomalies: number; avgPressure: number; totalFlow: number }[]
  >([]);

  const snapshot: LiveSensorState = useMemo(
    () => generateLiveSensorSnapshot(step, leakActive),
    [step, leakActive],
  );

  // Auto-trigger leak after step 12
  useEffect(() => {
    if (step === 12 && !leakActive) setLeakActive(true);
  }, [step, leakActive]);

  // Tick
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setStep((s) => s + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Build history
  useEffect(() => {
    setHistoryData((prev) => [
      ...prev.slice(-39),
      {
        label: snapshot.timestamp,
        probability: Math.round(snapshot.leakProbability * 100),
        anomalies: snapshot.anomalyCount,
        avgPressure: Number(
          (
            snapshot.sensors.reduce((s, r) => s + r.value, 0) /
            snapshot.sensors.length
          ).toFixed(1),
        ),
        totalFlow: Number(
          snapshot.flowSensors.reduce((s, r) => s + r.value, 0).toFixed(1),
        ),
      },
    ]);
  }, [snapshot]);

  const probPct = Math.round(snapshot.leakProbability * 100);
  const SIcon = statusIcon(snapshot.status);

  const handleReset = useCallback(() => {
    setStep(0);
    setLeakActive(false);
    setHistoryData([]);
    setIsRunning(true);
  }, []);

  const handleTriggerLeak = useCallback(() => {
    setLeakActive(true);
  }, []);

  return (
    <PageShell>
      <PageHeader
        title="Brain 1 — Leak Detection"
        subtitle="Monitors pressure and flow sensors for anomalies, builds persistence scores, and raises leak probability when deviations persist."
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? "Pause" : "Resume"}
            </Button>
            {!leakActive && (
              <Button size="sm" variant="outline" onClick={handleTriggerLeak}>
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Inject Leak
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        }
      />

      {/* Status Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={snapshot.status}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`mt-6 flex items-center gap-4 rounded-2xl border p-5 ${statusBg(snapshot.status)}`}
        >
          <motion.div
            animate={snapshot.status === "leak_detected" ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <SIcon className={`h-8 w-8 ${statusColor(snapshot.status)}`} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className={`text-lg font-bold ${statusColor(snapshot.status)}`}>
              {statusLabel(snapshot.status)}
            </p>
            <p className="text-sm text-muted-foreground">
              {snapshot.status === "leak_detected"
                ? `Persistent anomaly across ${snapshot.anomalyCount} sensors for ${snapshot.persistenceCount} consecutive intervals`
                : snapshot.status === "warning"
                  ? `${snapshot.anomalyCount} sensors showing deviation — monitoring persistence`
                  : "All sensor readings within expected baselines"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Leak Probability</p>
            <p className={`text-3xl font-bold font-display ${statusColor(snapshot.status)}`}>
              {probPct}%
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Top Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Radio}
          label="Active Sensors"
          value={PRESSURE_SENSORS.length + FLOW_SENSORS.length}
          hint={`${PRESSURE_SENSORS.length} pressure + ${FLOW_SENSORS.length} flow`}
          tone="good"
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomalous Sensors"
          value={snapshot.anomalyCount}
          hint="Deviation exceeds threshold"
          tone={snapshot.anomalyCount > 3 ? "bad" : snapshot.anomalyCount > 0 ? "warn" : "good"}
        />
        <StatCard
          icon={Timer}
          label="Persistence Count"
          value={snapshot.persistenceCount}
          hint="Consecutive anomalous intervals"
          tone={snapshot.persistenceCount > 4 ? "bad" : snapshot.persistenceCount > 0 ? "warn" : "default"}
        />
        <StatCard
          icon={Activity}
          label="Simulation Step"
          value={step}
          unit={`@ ${snapshot.timestamp}`}
          hint="5-min SCADA intervals"
        />
      </div>

      {/* Leak Probability Bar */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 card-soft p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Leak Probability Over Time</h3>
          <Badge variant={probPct > 70 ? "destructive" : probPct > 30 ? "secondary" : "secondary"}>
            {probPct}% confidence
          </Badge>
        </div>
        <div className="relative">
          <Progress
            value={probPct}
            className="h-4 rounded-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0% — Normal</span>
            <span>50% — Suspicious</span>
            <span>100% — Confirmed</span>
          </div>
        </div>
      </motion.section>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Average Pressure (mH₂O)" description="Across all 33 pressure sensors">
          <TrendArea
            data={historyData}
            dataKey="avgPressure"
            color="var(--color-chart-1)"
          />
        </ChartCard>
        <ChartCard title="Total Flow (L/s)" description="Aggregate from 3 flow sensors" delay={0.1}>
          <TrendArea
            data={historyData}
            dataKey="totalFlow"
            color="var(--color-chart-2)"
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Leak Probability Timeline" description="Algorithm confidence over time" delay={0.15}>
          <TrendArea
            data={historyData}
            dataKey="probability"
            color={probPct > 50 ? "#ef4444" : "var(--color-chart-3)"}
            unit="%"
          />
        </ChartCard>
        <ChartCard title="Anomaly Count" description="Number of sensors exceeding threshold" delay={0.2}>
          <TrendLines
            data={historyData}
            series={[
              { key: "anomalies", name: "Anomalous Sensors", color: "#f59e0b" },
            ]}
          />
        </ChartCard>
      </div>

      {/* Sensor Grid */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-6 card-soft p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Pressure Sensor Grid</h3>
            <p className="text-sm text-muted-foreground">
              Live readings vs. expected baseline — red indicates anomaly
            </p>
          </div>
          <Badge variant="secondary">{PRESSURE_SENSORS.length} sensors</Badge>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-11 gap-2">
          {snapshot.sensors.map((s) => (
            <motion.div
              key={s.id}
              animate={
                s.isAnomalous
                  ? { borderColor: ["rgba(239,68,68,0.3)", "rgba(239,68,68,0.8)", "rgba(239,68,68,0.3)"] }
                  : {}
              }
              transition={s.isAnomalous ? { repeat: Infinity, duration: 1.5 } : {}}
              className={`rounded-xl border p-2.5 text-center transition-colors ${
                s.isAnomalous
                  ? "bg-red-500/10 border-red-500/40"
                  : "bg-card border-border"
              }`}
            >
              <p className="text-[10px] font-mono text-muted-foreground truncate">{s.id}</p>
              <p className={`text-sm font-bold font-display ${s.isAnomalous ? "text-red-500" : ""}`}>
                {s.value}
              </p>
              <p className="text-[9px] text-muted-foreground">
                exp {s.expected}
              </p>
              {s.isAnomalous && (
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                  <span className="text-[9px] text-red-500 font-medium">-{s.deviation.toFixed(1)}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Flow Sensors */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 card-soft p-5"
      >
        <h3 className="text-base font-semibold mb-4">Flow Sensors</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {snapshot.flowSensors.map((f) => (
            <div
              key={f.id}
              className={`rounded-xl border p-4 ${
                f.isAnomalous
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono font-medium">{f.id}</p>
                {f.isAnomalous ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className={`text-2xl font-bold font-display mt-2 ${f.isAnomalous ? "text-red-500" : ""}`}>
                {f.value} <span className="text-sm font-normal text-muted-foreground">L/s</span>
              </p>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Expected: {f.expected} L/s</span>
                <span className={f.isAnomalous ? "text-red-500 font-medium" : ""}>
                  Δ {f.deviation.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Algorithm Explanation */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 card-soft p-5"
      >
        <h3 className="text-base font-semibold mb-3">Detection Algorithm</h3>
        <div className="grid sm:grid-cols-5 gap-3">
          {[
            { step: "1", label: "Expected Behaviour", desc: "Historical baseline per time-of-day", active: true },
            { step: "2", label: "Actual Readings", desc: "Live SCADA sensor values", active: step > 0 },
            { step: "3", label: "Residual Analysis", desc: "Compute deviation from expected", active: snapshot.anomalyCount > 0 },
            { step: "4", label: "Persistence Check", desc: "Anomaly must persist ≥4 intervals", active: snapshot.persistenceCount >= 2 },
            { step: "5", label: "Leak Probability", desc: "Confidence score generated", active: snapshot.status === "leak_detected" },
          ].map((s) => (
            <div
              key={s.step}
              className={`rounded-xl border p-3 text-center transition-all duration-300 ${
                s.active
                  ? "bg-primary/5 border-primary/30 shadow-sm"
                  : "bg-card border-border opacity-50"
              }`}
            >
              <div
                className={`mx-auto mb-2 h-8 w-8 rounded-full grid place-items-center text-sm font-bold ${
                  s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.step}
              </div>
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </PageShell>
  );
}
