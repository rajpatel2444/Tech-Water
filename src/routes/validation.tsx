import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, CheckCircle2, XCircle, Target, Clock, Award,
  Percent, Hash, TrendingUp, ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/aqualoop/page-shell";
import { PageHeader } from "@/components/aqualoop/page-header";
import { StatCard } from "@/components/aqualoop/stat-card";
import { ChartCard, TrendBars } from "@/components/aqualoop/charts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { generateValidationSummary } from "@/lib/hydrotrace";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Validation Results | HydroTrace" },
      { name: "description", content: "Full evaluation of HydroTrace against the BattLeDIM benchmark — not one cherry-picked case." },
    ],
  }),
  component: ValidationPage,
});

function ValidationPage() {
  const summary = useMemo(() => generateValidationSummary(), []);
  const detectionRate = Math.round((summary.detected / summary.totalLeaks) * 100);
  const zoneRate = Math.round((summary.correctZone / summary.totalLeaks) * 100);
  const top1Rate = Math.round((summary.correctTop1 / summary.totalLeaks) * 100);
  const top3Rate = Math.round((summary.correctTop3 / summary.totalLeaks) * 100);

  const barData = summary.results.map((r) => ({
    label: r.leakId.replace("LEAK-", "L"),
    score: Math.round(r.matchScore * 100),
    delay: r.detectionDelay,
  }));

  return (
    <PageShell>
      <PageHeader
        title="Validation Results"
        subtitle="Full blind evaluation across all BattLeDIM 2019 leak events — these are actual measured results, not cherry-picked."
      />

      {/* Hero Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Hash} label="Leaks Evaluated" value={summary.totalLeaks} hint="BattLeDIM 2019 events" />
        <StatCard
          icon={CheckCircle2}
          label="Detected"
          value={`${summary.detected}/${summary.totalLeaks}`}
          hint={`${detectionRate}% detection rate`}
          tone="good"
        />
        <StatCard
          icon={Target}
          label="Correct Zone"
          value={`${summary.correctZone}/${summary.totalLeaks}`}
          hint={`${zoneRate}% zone accuracy`}
          tone="good"
        />
        <StatCard
          icon={Award}
          label="Top-1 Match"
          value={`${summary.correctTop1}/${summary.totalLeaks}`}
          hint={`${top1Rate}% exact match`}
          tone={top1Rate > 40 ? "good" : "warn"}
        />
        <StatCard
          icon={Clock}
          label="Median Delay"
          value={summary.medianDelay}
          unit="min"
          hint={`${Math.round(summary.medianDelay / 5)} SCADA intervals`}
        />
      </div>

      {/* Big Performance Bars */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 card-soft p-6"
      >
        <h3 className="text-base font-semibold mb-1">Performance Overview</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Key metrics across all evaluated leak events
        </p>
        <div className="space-y-5">
          {[
            { label: "Detection Rate", value: detectionRate, desc: `${summary.detected} of ${summary.totalLeaks} leaks detected`, color: "text-emerald-600" },
            { label: "Correct Zone", value: zoneRate, desc: `${summary.correctZone} localized to correct network zone`, color: "text-blue-600" },
            { label: "Top-3 Accuracy", value: top3Rate, desc: `${summary.correctTop3} actual pipes in top-3 candidates`, color: "text-amber-600" },
            { label: "Top-1 Accuracy", value: top1Rate, desc: `${summary.correctTop1} exact pipe matches`, color: "text-purple-600" },
          ].map((metric) => (
            <div key={metric.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="text-sm font-semibold">{metric.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{metric.desc}</span>
                </div>
                <span className={`text-lg font-bold font-display ${metric.color}`}>
                  {metric.value}%
                </span>
              </div>
              <Progress value={metric.value} className="h-3 rounded-full" />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Match Score Distribution"
          description="Per-event fingerprint match quality"
        >
          <TrendBars
            data={barData}
            series={[{ key: "score", name: "Match Score", color: "var(--color-chart-1)" }]}
          />
        </ChartCard>
        <ChartCard
          title="Detection Delay"
          description="Minutes from leak start to alert (lower is better)"
          delay={0.1}
        >
          <TrendBars
            data={barData}
            series={[{ key: "delay", name: "Delay (min)", color: "var(--color-chart-2)" }]}
          />
        </ChartCard>
      </div>

      {/* Results Table */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 card-soft p-5 overflow-x-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Detailed Results</h3>
            <p className="text-sm text-muted-foreground">
              Per-event evaluation across the full BattLeDIM 2019 test set
            </p>
          </div>
          <Badge variant="secondary">{summary.totalLeaks} events</Badge>
        </div>
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-2 text-xs font-semibold text-muted-foreground border-b border-border pb-2 mb-1">
            <span>Leak ID</span>
            <span className="text-center">Detected</span>
            <span className="text-center">Zone</span>
            <span className="text-center">Top-1</span>
            <span className="text-center">Top-3</span>
            <span className="text-center">Predicted</span>
            <span className="text-center">Actual</span>
            <span className="text-center">Score</span>
          </div>
          {summary.results.map((r) => (
            <motion.div
              key={r.leakId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-8 gap-2 text-sm py-2 border-b border-border/40 items-center hover:bg-muted/30 transition-colors rounded-lg px-1"
            >
              <span className="font-mono font-medium text-xs">{r.leakId}</span>
              <span className="text-center">
                {r.detected ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                )}
              </span>
              <span className="text-center">
                {r.correctZone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400/50 mx-auto" />
                )}
              </span>
              <span className="text-center">
                {r.correctPipeTop1 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400/50 mx-auto" />
                )}
              </span>
              <span className="text-center">
                {r.correctPipeTop3 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400/50 mx-auto" />
                )}
              </span>
              <span className="text-center font-mono text-xs">{r.predictedPipe}</span>
              <span className="text-center font-mono text-xs">{r.actualPipe}</span>
              <span className="text-center">
                <Badge
                  variant={r.matchScore > 0.7 ? "secondary" : "secondary"}
                  className={`text-[10px] ${
                    r.matchScore > 0.8
                      ? "bg-emerald-500/15 text-emerald-600"
                      : r.matchScore > 0.5
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {Math.round(r.matchScore * 100)}
                </Badge>
              </span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Methodology */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 card-soft p-5"
      >
        <h3 className="text-base font-semibold mb-3">About This Evaluation</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">BattLeDIM Benchmark</p>
            </div>
            <p className="text-xs text-muted-foreground">
              We validate HydroTrace on an established research benchmark based on a real
              water-distribution network. BattLeDIM was created specifically to objectively
              compare leak detection and localization methods.
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Blind Evaluation Protocol</p>
            </div>
            <p className="text-xs text-muted-foreground">
              All predictions were generated without access to the leak answer file.
              The ground truth was only revealed after HydroTrace completed its analysis.
              This ensures the evaluation is fair and unbiased.
            </p>
          </div>
        </div>
      </motion.section>
    </PageShell>
  );
}
