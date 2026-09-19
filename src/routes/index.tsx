import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, Droplets,
  Eye, MapPin, Radio, Shield, ShieldCheck, Target, Timer,
  TrendingDown, TrendingUp, Waves, Zap, BarChart3,
} from "lucide-react";
import { PageShell } from "@/components/aqualoop/page-shell";
import { ChartCard, TrendArea, TrendLines } from "@/components/aqualoop/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PRESSURE_SENSORS,
  FLOW_SENSORS,
  generateLiveSensorSnapshot,
  generateValidationSummary,
  type LiveSensorState,
} from "@/lib/hydrotrace";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "HydroTrace — Intelligent Leak Detection & Localization" },
        {
          name: "description",
          content:
            "AI-powered water network monitoring system using hydraulic fingerprinting to detect, localize, and verify pipe leaks in real time.",
        },
        { property: "og:title", content: "HydroTrace — Command Center" },
      ],
    }),
    component: Dashboard,
  },
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function StatusPulse({ status }: { status: string }) {
  const color =
    status === "leak_detected"
      ? "bg-red-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <span className="relative flex h-3 w-3">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`}
      />
      <span className={`relative inline-flex h-3 w-3 rounded-full ${color}`} />
    </span>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard() {
  const [step, setStep] = useState(0);
  const [leakActive, setLeakActive] = useState(false);
  const [pressureHistory, setPressureHistory] = useState<
    { label: string; avgPressure: number; totalFlow: number; probability: number }[]
  >([]);

  const snapshot: LiveSensorState = useMemo(
    () => generateLiveSensorSnapshot(step, leakActive),
    [step, leakActive],
  );
  const validation = useMemo(() => generateValidationSummary(), []);

  // Auto-tick
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => s + 1), 2000);
    return () => clearInterval(timer);
  }, []);

  // Auto-trigger leak after step 14
  useEffect(() => {
    if (step === 14 && !leakActive) setLeakActive(true);
  }, [step, leakActive]);

  // Build chart history
  useEffect(() => {
    setPressureHistory((prev) => [
      ...prev.slice(-29),
      {
        label: snapshot.timestamp,
        avgPressure: Number(
          (snapshot.sensors.reduce((s, r) => s + r.value, 0) / snapshot.sensors.length).toFixed(1),
        ),
        totalFlow: Number(snapshot.flowSensors.reduce((s, r) => s + r.value, 0).toFixed(1)),
        probability: Math.round(snapshot.leakProbability * 100),
      },
    ]);
  }, [snapshot]);

  const probPct = Math.round(snapshot.leakProbability * 100);
  const detectionRate = Math.round((validation.detected / validation.totalLeaks) * 100);
  const top3Rate = Math.round((validation.correctTop3 / validation.totalLeaks) * 100);

  const statusLabel =
    snapshot.status === "leak_detected"
      ? "LEAK DETECTED"
      : snapshot.status === "warning"
        ? "ANOMALY WARNING"
        : "ALL SYSTEMS NORMAL";
  const statusColor =
    snapshot.status === "leak_detected"
      ? "text-red-500"
      : snapshot.status === "warning"
        ? "text-amber-500"
        : "text-emerald-500";
  const statusBg =
    snapshot.status === "leak_detected"
      ? "from-red-500/10 to-red-500/5 border-red-500/25"
      : snapshot.status === "warning"
        ? "from-amber-500/10 to-amber-500/5 border-amber-500/25"
        : "from-emerald-500/10 to-emerald-500/5 border-emerald-500/25";

  return (
    <PageShell>
      {/* ───── Hero Header ───── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${statusBg} p-6 sm:p-8`}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-20 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Waves className="h-6 w-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
                HydroTrace
              </h1>
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                Command Center
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">
              Intelligent water network leak detection &amp; localization powered by hydraulic
              fingerprinting and real-time SCADA sensor analysis.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <StatusPulse status={snapshot.status} />
                <span className={`text-sm font-bold uppercase tracking-wide ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PRESSURE_SENSORS.length + FLOW_SENSORS.length} sensors ·{" "}
                {snapshot.timestamp} UTC
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ───── Key Metrics ───── */}
      <div className="mt-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Radio,
            label: "Sensors Online",
            value: `${PRESSURE_SENSORS.length + FLOW_SENSORS.length}`,
            sub: `${PRESSURE_SENSORS.length} pressure · ${FLOW_SENSORS.length} flow`,
            color: "text-emerald-500 bg-emerald-500/10",
          },
          {
            icon: AlertTriangle,
            label: "Anomalies Now",
            value: String(snapshot.anomalyCount),
            sub: snapshot.anomalyCount > 0 ? "Sensors exceeding threshold" : "All within baseline",
            color:
              snapshot.anomalyCount > 3
                ? "text-red-500 bg-red-500/10"
                : snapshot.anomalyCount > 0
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-emerald-500 bg-emerald-500/10",
          },
          {
            icon: Target,
            label: "Leak Probability",
            value: `${probPct}%`,
            sub: probPct > 70 ? "High — investigate" : probPct > 30 ? "Elevated — monitoring" : "Normal operation",
            color:
              probPct > 70
                ? "text-red-500 bg-red-500/10"
                : probPct > 30
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-emerald-500 bg-emerald-500/10",
          },
          {
            icon: Timer,
            label: "Persistence",
            value: `${snapshot.persistenceCount}/8`,
            sub: `${snapshot.persistenceCount} consecutive anomalous intervals`,
            color:
              snapshot.persistenceCount > 4
                ? "text-red-500 bg-red-500/10"
                : "text-muted-foreground bg-muted",
          },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-soft p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                  {m.label}
                </p>
                <p className="mt-1.5 text-2xl font-bold font-display">{m.value}</p>
              </div>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ───── Live Pressure + Probability ───── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Network Pressure" description="Average across 33 sensors (mH₂O)">
          <TrendArea data={pressureHistory} dataKey="avgPressure" color="var(--color-chart-1)" />
        </ChartCard>
        <ChartCard
          title="Leak Probability"
          description="Algorithm confidence timeline"
          delay={0.08}
        >
          <TrendArea
            data={pressureHistory}
            dataKey="probability"
            color={probPct > 50 ? "#ef4444" : "var(--color-chart-2)"}
            unit="%"
          />
        </ChartCard>
      </div>

      {/* ───── 3-Brain Overview Cards ───── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold">Three-Brain Architecture</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Brain 1 */}
          <Link to="/detection" className="group">
            <div className="card-soft p-5 h-full transition-all hover:shadow-md hover:border-primary/30 group-hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 grid place-items-center">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Brain 1</p>
                  <p className="text-xs text-muted-foreground">Detection</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`ml-auto text-[10px] ${
                    snapshot.status === "leak_detected"
                      ? "bg-red-500/15 text-red-500"
                      : snapshot.status === "warning"
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-emerald-500/15 text-emerald-500"
                  }`}
                >
                  {snapshot.status === "leak_detected"
                    ? "ALERT"
                    : snapshot.status === "warning"
                      ? "WARNING"
                      : "NORMAL"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                "Is something wrong?" — Monitors 33 pressure + 3 flow sensors for persistent anomalies
                using residual analysis and adaptive thresholds.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${snapshot.anomalyCount > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {snapshot.anomalyCount} anomalies
                  </span>
                  <span className="text-muted-foreground">{probPct}% probability</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>

          {/* Brain 2 */}
          <Link to="/localization" className="group">
            <div className="card-soft p-5 h-full transition-all hover:shadow-md hover:border-primary/30 group-hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 grid place-items-center">
                  <MapPin className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Brain 2</p>
                  <p className="text-xs text-muted-foreground">Localization</p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  TOPOLOGY
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                "Where is it?" — Uses network graph topology + WNTR hydraulic simulations
                to narrow 900+ pipes to a ranked shortlist of candidates.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">264 pipes</span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Fingerprint matching
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>

          {/* Brain 3 */}
          <Link to="/verification" className="group">
            <div className="card-soft p-5 h-full transition-all hover:shadow-md hover:border-primary/30 group-hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 grid place-items-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Brain 3</p>
                  <p className="text-xs text-muted-foreground">Verification</p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  GROUND TRUTH
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                "Were we right?" — Compares blind predictions against the BattLeDIM
                benchmark answer file to objectively measure accuracy.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Blind evaluation
                  </span>
                  <span className="text-muted-foreground">Reveal on demand</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* ───── Live Sensor Mini-Grid ───── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 card-soft p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold">Live Sensor Array</h3>
            <p className="text-xs text-muted-foreground">
              Pressure readings vs. expected — red = anomaly detected
            </p>
          </div>
          <Link to="/detection">
            <Button variant="outline" size="sm" className="gap-1.5">
              Full View <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 lg:grid-cols-17 gap-1.5">
          {snapshot.sensors.slice(0, 33).map((s) => (
            <motion.div
              key={s.id}
              className={`rounded-lg p-1.5 text-center border transition-colors ${
                s.isAnomalous
                  ? "bg-red-500/10 border-red-500/40"
                  : "bg-card border-border/60"
              }`}
              animate={
                s.isAnomalous
                  ? { opacity: [0.7, 1, 0.7] }
                  : {}
              }
              transition={s.isAnomalous ? { repeat: Infinity, duration: 1.2 } : {}}
            >
              <p className="text-[8px] font-mono text-muted-foreground leading-none">{s.id}</p>
              <p
                className={`text-xs font-bold leading-tight mt-0.5 ${
                  s.isAnomalous ? "text-red-500" : ""
                }`}
              >
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>
        {/* Flow Sensors inline */}
        <div className="mt-3 flex gap-3 flex-wrap">
          {snapshot.flowSensors.map((f) => (
            <div
              key={f.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                f.isAnomalous ? "bg-red-500/10 border-red-500/30" : "bg-card border-border/60"
              }`}
            >
              <span className="font-mono font-medium">{f.id}</span>
              <span className={`font-bold ${f.isAnomalous ? "text-red-500" : ""}`}>
                {f.value} L/s
              </span>
              {f.isAnomalous ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ───── Validation Summary + Flow Chart ───── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Validation Summary */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-soft p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Benchmark Validation</h3>
            </div>
            <Link to="/validation">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                Details <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Evaluated on {validation.totalLeaks} BattLeDIM 2019 leak events
          </p>
          <div className="space-y-3">
            {[
              { label: "Detection Rate", value: detectionRate, count: `${validation.detected}/${validation.totalLeaks}` },
              { label: "Correct Zone", value: Math.round((validation.correctZone / validation.totalLeaks) * 100), count: `${validation.correctZone}/${validation.totalLeaks}` },
              { label: "Top-3 Accuracy", value: top3Rate, count: `${validation.correctTop3}/${validation.totalLeaks}` },
              { label: "Top-1 Accuracy", value: Math.round((validation.correctTop1 / validation.totalLeaks) * 100), count: `${validation.correctTop1}/${validation.totalLeaks}` },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-muted-foreground">
                    {m.count} · <strong className="text-foreground">{m.value}%</strong>
                  </span>
                </div>
                <Progress value={m.value} className="h-2" />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-primary/5 border border-primary/15 p-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Median detection delay:</strong>{" "}
              {validation.medianDelay} minutes ({Math.round(validation.medianDelay / 5)} SCADA intervals)
            </p>
          </div>
        </motion.section>

        {/* Flow Chart */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Aggregate Network Flow"
            description="Total from PUMP_1, PUMP_2, V_PU4 — surge indicates possible leak"
            delay={0.3}
          >
            <TrendArea data={pressureHistory} dataKey="totalFlow" color="var(--color-chart-3)" unit=" L/s" />
          </ChartCard>
        </div>
      </div>

      {/* ───── How It Works (pipeline) ───── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 card-soft p-5"
      >
        <h3 className="text-base font-semibold mb-1">How HydroTrace Works</h3>
        <p className="text-xs text-muted-foreground mb-4">
          From raw sensor data to verified leak location in one automated pipeline
        </p>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {[
            { icon: Radio, label: "SCADA Sensors", desc: "5-min telemetry", color: "text-blue-500 bg-blue-500/10" },
            { icon: Activity, label: "Baseline Model", desc: "Expected behaviour", color: "text-cyan-500 bg-cyan-500/10" },
            { icon: TrendingDown, label: "Residual Analysis", desc: "Deviation detection", color: "text-amber-500 bg-amber-500/10" },
            { icon: Timer, label: "Persistence Check", desc: "≥4 intervals", color: "text-orange-500 bg-orange-500/10" },
            { icon: MapPin, label: "Zone Narrowing", desc: "Topology filter", color: "text-purple-500 bg-purple-500/10" },
            { icon: Droplets, label: "WNTR Simulation", desc: "Hydraulic fingerprint", color: "text-indigo-500 bg-indigo-500/10" },
            { icon: Target, label: "Top Candidates", desc: "Ranked by match", color: "text-emerald-500 bg-emerald-500/10" },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-1.5 shrink-0">
              <div className="rounded-xl border p-3 text-center min-w-[100px]">
                <div className={`h-8 w-8 rounded-lg grid place-items-center mx-auto mb-1.5 ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-semibold leading-tight">{s.label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
              {i < 6 && (
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* ───── Dataset & Methodology Footer ───── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">BattLeDIM Benchmark</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Validated on an established research benchmark based on a real water-distribution
            network (L-Town). 33 pressure sensors, 3 flow sensors, 5-minute SCADA intervals,
            with known leak ground truth for objective evaluation.
          </p>
        </div>
        <div className="card-soft p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Methodology</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            We use cheap statistical analysis first (residual + persistence), then expensive
            hydraulic simulation only for filtered candidates. This two-stage approach is both
            computationally efficient and engineering-sound.
          </p>
        </div>
      </motion.div>
    </PageShell>
  );
}
