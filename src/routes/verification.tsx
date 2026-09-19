import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Trophy, Eye, EyeOff, Sparkles, Award } from "lucide-react";
import { PageShell } from "@/components/hydrotrace/page-shell";
import { PageHeader } from "@/components/hydrotrace/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { generateLeakEvents } from "@/lib/hydrotrace";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Verification | HydroTrace" },
      {
        name: "description",
        content: "Brain 3 — Compare HydroTrace predictions against known ground truth.",
      },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const events = useMemo(() => generateLeakEvents(8), []);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const event = events[selectedIdx]!;

  const isMatch = event.matchRank === 1;
  const isTop3 = event.matchRank >= 1 && event.matchRank <= 3;

  return (
    <PageShell>
      <PageHeader
        title="Brain 3 — Verification"
        subtitle="HydroTrace predicts the leak location without seeing the answer file. Then we reveal the ground truth."
        actions={
          <Button
            size="sm"
            variant={revealed ? "outline" : "default"}
            onClick={() => setRevealed(!revealed)}
            className="gap-2"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {revealed ? "Hide Ground Truth" : "Reveal Ground Truth"}
          </Button>
        }
      />

      {/* Event Selector */}
      <div className="mt-6 flex gap-2 flex-wrap">
        {events.map((e, i) => (
          <Button
            key={e.id}
            size="sm"
            variant={i === selectedIdx ? "default" : "outline"}
            onClick={() => {
              setSelectedIdx(i);
              setRevealed(false);
            }}
          >
            {e.id}
          </Button>
        ))}
      </div>

      {/* Main Comparison Panel */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Prediction */}
        <motion.section
          key={`pred-${selectedIdx}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-soft p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="flex items-center gap-2 mb-5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 grid place-items-center">
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">HydroTrace Prediction</h3>
              <p className="text-xs text-muted-foreground">
                Generated without accessing answer file
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Predicted Leak Pipe
              </p>
              <p className="text-3xl font-bold font-display text-blue-600 mt-1">
                {event.topCandidates[0]?.pipeId}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">
                Top 3 Candidates
              </p>
              {event.topCandidates.slice(0, 3).map((c, i) => (
                <div
                  key={c.pipeId}
                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <div
                    className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold ${
                      i === 0 ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="font-mono text-sm font-medium flex-1">{c.pipeId}</span>
                  <Badge variant="secondary">{c.zone}</Badge>
                  <span className="font-display font-bold text-sm w-10 text-right">
                    {Math.round(c.matchScore * 100)}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3 text-center">
                <p className="text-xs text-muted-foreground">Detection Delay</p>
                <p className="text-lg font-bold font-display">{event.detectionDelay} min</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <p className="text-xs text-muted-foreground">Peak Leak Rate</p>
                <p className="text-lg font-bold font-display">{event.peakRate} L/s</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Ground Truth */}
        <motion.section
          key={`truth-${selectedIdx}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card-soft p-6 relative overflow-hidden"
        >
          <div
            className={`absolute top-0 left-0 w-full h-1 ${
              revealed
                ? isMatch
                  ? "bg-gradient-to-r from-emerald-500 to-green-400"
                  : isTop3
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                    : "bg-gradient-to-r from-red-500 to-orange-400"
                : "bg-gradient-to-r from-gray-400 to-gray-300"
            }`}
          />
          <div className="flex items-center gap-2 mb-5">
            <div
              className={`h-10 w-10 rounded-xl grid place-items-center ${
                revealed ? "bg-emerald-500/15" : "bg-muted"
              }`}
            >
              <Trophy
                className={`h-5 w-5 ${revealed ? "text-emerald-500" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold">Ground Truth</h3>
              <p className="text-xs text-muted-foreground">From 2019_Leakages.csv</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {revealed ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div
                  className={`rounded-xl p-4 border ${
                    isMatch
                      ? "bg-emerald-500/8 border-emerald-500/30"
                      : isTop3
                        ? "bg-amber-500/8 border-amber-500/30"
                        : "bg-red-500/8 border-red-500/30"
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Actual Leak Pipe
                  </p>
                  <p
                    className={`text-3xl font-bold font-display mt-1 ${
                      isMatch ? "text-emerald-600" : isTop3 ? "text-amber-600" : "text-red-500"
                    }`}
                  >
                    {event.actualPipe}
                  </p>
                </div>

                {/* Match Result */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className={`rounded-2xl p-6 text-center border-2 ${
                    isMatch
                      ? "bg-emerald-500/10 border-emerald-500/40"
                      : isTop3
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-red-500/10 border-red-500/40"
                  }`}
                >
                  {isMatch ? (
                    <>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                      >
                        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                      </motion.div>
                      <p className="text-2xl font-bold mt-3 text-emerald-600">TOP-1 MATCH ✓</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Predicted pipe exactly matches the actual leak location
                      </p>
                    </>
                  ) : isTop3 ? (
                    <>
                      <Award className="h-12 w-12 text-amber-500 mx-auto" />
                      <p className="text-2xl font-bold mt-3 text-amber-600">TOP-3 MATCH</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Actual pipe was ranked #{event.matchRank} in our candidates
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                      <p className="text-2xl font-bold mt-3 text-red-500">MISS</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pipe not in top-3 candidates — review needed
                      </p>
                    </>
                  )}
                </motion.div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Start Time</p>
                    <p className="text-sm font-bold font-display">{event.startTime}</p>
                  </div>
                  <div className="rounded-xl border p-3 text-center">
                    <p className="text-xs text-muted-foreground">Severity</p>
                    <Badge
                      variant={
                        event.severity === "critical"
                          ? "destructive"
                          : event.severity === "high"
                            ? "secondary"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {event.severity}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="h-20 w-20 rounded-full bg-muted grid place-items-center mb-4">
                  <EyeOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-muted-foreground">
                  Ground truth is hidden
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  HydroTrace generated its prediction without reading the leak answer file. Click
                  "Reveal Ground Truth" to see if the prediction was correct.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </div>

      {/* Side-by-side Summary */}
      {revealed && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 card-soft p-6"
        >
          <h3 className="text-base font-semibold mb-4">Comparison Summary</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Predicted Pipe",
                value: event.topCandidates[0]?.pipeId ?? "—",
                sub: "HydroTrace output",
                color: "text-blue-600",
              },
              {
                label: "Actual Pipe",
                value: event.actualPipe,
                sub: "From ground truth",
                color: "text-emerald-600",
              },
              {
                label: "Match Result",
                value: isMatch ? "EXACT" : isTop3 ? `TOP-${event.matchRank}` : "MISS",
                sub: isMatch ? "Perfect prediction" : isTop3 ? "Within top 3" : "Not in candidates",
                color: isMatch ? "text-emerald-600" : isTop3 ? "text-amber-600" : "text-red-500",
              },
              {
                label: "Detection Delay",
                value: `${event.detectionDelay} min`,
                sub: `${Math.round(event.detectionDelay / 5)} SCADA intervals`,
                color: event.detectionDelay < 30 ? "text-emerald-600" : "text-amber-600",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {item.label}
                </p>
                <p className={`text-xl font-bold font-display mt-1 ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Methodology Note */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 card-soft p-5"
      >
        <h3 className="text-base font-semibold mb-3">Verification Methodology</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Blind Prediction",
              desc: "HydroTrace processes sensor data and outputs a ranked list of candidate pipes — without ever reading the leak answer file.",
            },
            {
              step: "2",
              title: "Ground Truth Reveal",
              desc: "We then load the actual leak records from the BattLeDIM benchmark dataset (2019_Leakages.csv).",
            },
            {
              step: "3",
              title: "Objective Comparison",
              desc: "Match result is computed: Top-1 match (exact), Top-3 match (close), or Miss — with detection delay in minutes.",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border p-4">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-bold mb-2">
                {s.step}
              </div>
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </PageShell>
  );
}
