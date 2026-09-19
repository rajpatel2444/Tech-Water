/**
 * HydroTrace — Fake data generators for the leak detection prototype.
 * Everything here is simulated. No real datasets involved.
 */

// ─── Sensor Names (mimicking BattLeDIM-style IDs) ────────────────────────────
export const PRESSURE_SENSORS = [
  "n1", "n4", "n31", "n54", "n105", "n114", "n163", "n188",
  "n229", "n288", "n296", "n332", "n342", "n410", "n415",
  "n429", "n458", "n469", "n495", "n506", "n516", "n519",
  "n549", "n613", "n636", "n644", "n679", "n722", "n726",
  "n740", "n752", "n769", "n31a",
] as const;

export const FLOW_SENSORS = ["PUMP_1", "PUMP_2", "V_PU4"] as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SensorReading {
  id: string;
  timestamp: string;
  value: number;
  expected: number;
  deviation: number;
  isAnomalous: boolean;
}

export interface LeakEvent {
  id: string;
  pipeId: string;
  startTime: string;
  endTime: string;
  peakRate: number; // L/s
  area: string;
  severity: "low" | "medium" | "high" | "critical";
  detected: boolean;
  detectionDelay: number; // minutes
  topCandidates: CandidatePipe[];
  actualPipe: string;
  matchRank: number; // 1 = Top-1 correct
}

export interface CandidatePipe {
  pipeId: string;
  matchScore: number;
  zone: string;
}

export interface NetworkNode {
  id: string;
  x: number;
  y: number;
  type: "junction" | "tank" | "reservoir" | "sensor";
  pressure?: number;
  anomaly?: number; // 0–1 strength
}

export interface NetworkPipe {
  id: string;
  from: string;
  to: string;
  diameter: number;
  length: number;
  status: "normal" | "suspect" | "leaking";
  leakScore?: number;
}

export interface TimeStep {
  time: string;
  pressures: Record<string, number>;
  flows: Record<string, number>;
  leakProbability: number;
  status: "normal" | "warning" | "leak_detected";
  anomalousSensors: string[];
}

export interface ValidationResult {
  leakId: string;
  detected: boolean;
  correctZone: boolean;
  correctPipeTop1: boolean;
  correctPipeTop3: boolean;
  detectionDelay: number; // minutes
  predictedPipe: string;
  actualPipe: string;
  matchScore: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

// ─── Generate fake pressure timeline ─────────────────────────────────────────
export function generatePressureTimeline(
  steps: number,
  leakStartStep: number,
): TimeStep[] {
  const basePressures: Record<string, number> = {};
  PRESSURE_SENSORS.forEach((s) => {
    basePressures[s] = rand(38, 56);
  });

  const baseFlows: Record<string, number> = {};
  FLOW_SENSORS.forEach((s) => {
    baseFlows[s] = rand(80, 140);
  });

  const timeline: TimeStep[] = [];
  const startHour = 6;

  for (let i = 0; i < steps; i++) {
    const mins = i * 5;
    const h = startHour + Math.floor(mins / 60);
    const m = mins % 60;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    const isAfterLeak = i >= leakStartStep;
    const leakAge = isAfterLeak ? i - leakStartStep : 0;
    const leakIntensity = isAfterLeak ? Math.min(1, leakAge / 8) : 0;

    const pressures: Record<string, number> = {};
    const anomalousSensors: string[] = [];

    PRESSURE_SENSORS.forEach((s, idx) => {
      let noise = rand(-0.8, 0.8);
      let drop = 0;

      if (isAfterLeak) {
        // Sensors close to the "leak zone" drop more
        const proximity = idx < 8 ? 1 : idx < 16 ? 0.6 : idx < 24 ? 0.3 : 0.1;
        drop = leakIntensity * proximity * rand(5, 14);
      }

      const value = Number((basePressures[s]! + noise - drop).toFixed(1));
      pressures[s] = value;

      if (drop > 3) {
        anomalousSensors.push(s);
      }
    });

    const flows: Record<string, number> = {};
    FLOW_SENSORS.forEach((s) => {
      let noise = rand(-2, 2);
      let surge = isAfterLeak ? leakIntensity * rand(8, 25) : 0;
      flows[s] = Number((baseFlows[s]! + noise + surge).toFixed(1));
    });

    // Detection logic (fake)
    let leakProbability = 0;
    let status: TimeStep["status"] = "normal";

    if (isAfterLeak) {
      leakProbability = Math.min(0.99, leakAge * 0.12 + rand(0, 0.05));
      if (leakAge >= 4) {
        status = "leak_detected";
      } else if (leakAge >= 2) {
        status = "warning";
      }
    } else {
      leakProbability = rand(0, 0.08);
    }

    timeline.push({
      time,
      pressures,
      flows,
      leakProbability: Number(leakProbability.toFixed(3)),
      status,
      anomalousSensors,
    });
  }

  return timeline;
}

// ─── Fake leak events (like 2019_Leakages.csv) ──────────────────────────────
export function generateLeakEvents(count: number = 20): LeakEvent[] {
  const zones = ["Zone-A North", "Zone-B Central", "Zone-C South", "Zone-D West", "Zone-E East"];
  const events: LeakEvent[] = [];

  for (let i = 0; i < count; i++) {
    const pipeId = `p${100 + Math.floor(rand(0, 800))}`;
    const zone = pick(zones);
    const severity = pick(["low", "medium", "high", "critical"] as const);
    const detected = Math.random() < 0.85;
    const correctRank = detected ? Math.floor(rand(1, 6)) : 0;
    const delay = detected ? Math.round(rand(10, 90)) : 0;

    const topCandidates: CandidatePipe[] = [];
    // Generate 5 candidates, put the correct one at the right rank
    for (let c = 0; c < 5; c++) {
      const candidatePipe = c + 1 === correctRank ? pipeId : `p${100 + Math.floor(rand(0, 800))}`;
      topCandidates.push({
        pipeId: candidatePipe,
        matchScore: Number((0.95 - c * 0.12 + rand(-0.04, 0.04)).toFixed(2)),
        zone: c === 0 ? zone : pick(zones),
      });
    }
    // Sort by score descending
    topCandidates.sort((a, b) => b.matchScore - a.matchScore);

    const day = String(1 + Math.floor(rand(0, 28))).padStart(2, "0");
    const month = String(1 + Math.floor(rand(0, 11))).padStart(2, "0");
    const hour = String(Math.floor(rand(0, 23))).padStart(2, "0");

    events.push({
      id: `LEAK-${String(i + 1).padStart(3, "0")}`,
      pipeId,
      startTime: `2019-${month}-${day} ${hour}:${String(Math.floor(rand(0, 59))).padStart(2, "0")}`,
      endTime: `2019-${month}-${day} ${String(Math.min(23, parseInt(hour) + Math.floor(rand(1, 8)))).padStart(2, "0")}:${String(Math.floor(rand(0, 59))).padStart(2, "0")}`,
      peakRate: Number(rand(0.5, 8.5).toFixed(2)),
      area: zone,
      severity,
      detected,
      detectionDelay: delay,
      topCandidates,
      actualPipe: pipeId,
      matchRank: correctRank,
    });
  }

  return events;
}

// ─── Network topology (fake nodes + pipes for visual) ────────────────────────
export function generateNetworkTopology(): {
  nodes: NetworkNode[];
  pipes: NetworkPipe[];
} {
  const nodes: NetworkNode[] = [];
  const pipes: NetworkPipe[] = [];

  // Generate grid-like nodes
  const gridSize = 12;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const id = `n${row * gridSize + col + 1}`;
      nodes.push({
        id,
        x: 60 + col * 70 + rand(-10, 10),
        y: 40 + row * 50 + rand(-8, 8),
        type: "junction",
        pressure: rand(35, 55),
        anomaly: 0,
      });
    }
  }

  // Add special nodes
  nodes.push(
    { id: "T1", x: 30, y: 20, type: "tank", pressure: 60 },
    { id: "R1", x: 880, y: 20, type: "reservoir", pressure: 65 },
  );

  // Add sensor markers
  PRESSURE_SENSORS.slice(0, 12).forEach((sid, i) => {
    const node = nodes[i * 11];
    if (node) {
      nodes.push({
        id: `sensor-${sid}`,
        x: node.x,
        y: node.y,
        type: "sensor",
        pressure: node.pressure,
      });
    }
  });

  // Generate pipes connecting adjacent nodes
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const idx = row * gridSize + col;
      const nodeId = `n${idx + 1}`;

      if (col < gridSize - 1) {
        const rightId = `n${idx + 2}`;
        pipes.push({
          id: `p${pipes.length + 100}`,
          from: nodeId,
          to: rightId,
          diameter: rand(100, 400),
          length: rand(30, 200),
          status: "normal",
        });
      }
      if (row < gridSize - 1) {
        const belowId = `n${(row + 1) * gridSize + col + 1}`;
        pipes.push({
          id: `p${pipes.length + 100}`,
          from: nodeId,
          to: belowId,
          diameter: rand(100, 400),
          length: rand(30, 200),
          status: "normal",
        });
      }
    }
  }

  return { nodes, pipes };
}

// ─── Validation summary (fake BattLeDIM-style evaluation) ────────────────────
export function generateValidationSummary(): {
  totalLeaks: number;
  detected: number;
  correctZone: number;
  correctTop1: number;
  correctTop3: number;
  medianDelay: number;
  results: ValidationResult[];
} {
  const total = 23;
  const results: ValidationResult[] = [];

  let detected = 0;
  let correctZone = 0;
  let correctTop1 = 0;
  let correctTop3 = 0;
  const delays: number[] = [];

  for (let i = 0; i < total; i++) {
    const wasDetected = Math.random() < 0.87;
    const isZoneCorrect = wasDetected && Math.random() < 0.78;
    const isTop1 = isZoneCorrect && Math.random() < 0.52;
    const isTop3 = isZoneCorrect && (isTop1 || Math.random() < 0.65);
    const delay = wasDetected ? Math.round(rand(10, 75)) : 0;
    const pipeNum = 100 + Math.floor(rand(0, 800));
    const matchDelta = isTop1 ? 0 : Math.floor(rand(1, 30));

    if (wasDetected) detected++;
    if (isZoneCorrect) correctZone++;
    if (isTop1) correctTop1++;
    if (isTop3) correctTop3++;
    if (delay > 0) delays.push(delay);

    results.push({
      leakId: `LEAK-${String(i + 1).padStart(3, "0")}`,
      detected: wasDetected,
      correctZone: isZoneCorrect,
      correctPipeTop1: isTop1,
      correctPipeTop3: isTop3,
      detectionDelay: delay,
      predictedPipe: `p${pipeNum + matchDelta}`,
      actualPipe: `p${pipeNum}`,
      matchScore: Number((isTop1 ? rand(0.82, 0.97) : rand(0.35, 0.78)).toFixed(2)),
    });
  }

  delays.sort((a, b) => a - b);
  const medianDelay = delays.length > 0 ? delays[Math.floor(delays.length / 2)]! : 0;

  return { totalLeaks: total, detected, correctZone, correctTop1, correctTop3, medianDelay, results };
}

// ─── Live sensor data for the streaming demo ─────────────────────────────────
export interface LiveSensorState {
  sensors: SensorReading[];
  flowSensors: SensorReading[];
  leakProbability: number;
  status: "normal" | "warning" | "leak_detected";
  detectedPipe: string | null;
  timestamp: string;
  anomalyCount: number;
  persistenceCount: number;
}

export function generateLiveSensorSnapshot(
  step: number,
  leakActive: boolean,
): LiveSensorState {
  const mins = step * 5;
  const h = 8 + Math.floor(mins / 60);
  const m = mins % 60;
  const timestamp = `${String(h % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const sensors: SensorReading[] = PRESSURE_SENSORS.map((id, idx) => {
    const expected = 42 + idx * 0.4 + Math.sin(idx) * 3;
    let value = expected + rand(-0.6, 0.6);

    if (leakActive && idx < 10) {
      value -= rand(3, 12);
    }

    const deviation = Number(Math.abs(value - expected).toFixed(2));
    return {
      id,
      timestamp,
      value: Number(value.toFixed(1)),
      expected: Number(expected.toFixed(1)),
      deviation,
      isAnomalous: deviation > 3,
    };
  });

  const flowSensors: SensorReading[] = FLOW_SENSORS.map((id) => {
    const expected = 110 + rand(-5, 5);
    let value = expected + rand(-2, 2);
    if (leakActive) value += rand(10, 30);
    const deviation = Number(Math.abs(value - expected).toFixed(2));
    return {
      id,
      timestamp,
      value: Number(value.toFixed(1)),
      expected: Number(expected.toFixed(1)),
      deviation,
      isAnomalous: deviation > 8,
    };
  });

  const anomalyCount = sensors.filter((s) => s.isAnomalous).length;

  return {
    sensors,
    flowSensors,
    leakProbability: leakActive ? clamp(0.4 + step * 0.05, 0, 0.97) : rand(0.01, 0.06),
    status: leakActive && step > 6 ? "leak_detected" : leakActive ? "warning" : "normal",
    detectedPipe: leakActive && step > 6 ? "p271" : null,
    timestamp,
    anomalyCount,
    persistenceCount: leakActive ? Math.min(step, 8) : 0,
  };
}
