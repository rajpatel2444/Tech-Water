<div align="center">

# 💧 HydroTrace

### AI-Powered Leak Detection & Localization for Water Distribution Networks

</div>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white&style=for-the-badge" alt="React"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge" alt="TypeScript"></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge" alt="Vite"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge" alt="Tailwind CSS"></a>
  <a href="https://ui.shadcn.com"><img src="https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white&style=for-the-badge" alt="shadcn/ui"></a>
  <a href="https://github.com/rajpatel2444/Tech-Water/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/rajpatel2444/Tech-Water/ci.yml?style=for-the-badge&label=Build%20Status" alt="Build Status"></a>
  <img src="https://img.shields.io/badge/Status-Prototype-orange?style=for-the-badge" alt="Status: Prototype">
  <img src="https://img.shields.io/badge/Dataset-BattLeDIM-blue?style=for-the-badge" alt="Dataset">
  <img src="https://img.shields.io/badge/Sustainability-Water_Conservation-0d9488?style=for-the-badge" alt="Sustainability">
  <img src="https://img.shields.io/badge/Open_Source-Ready-brightgreen?style=for-the-badge" alt="Open Source Ready">
</p>

---

## 🌍 The Problem: Invisible Water Loss

Globally, aging water distribution networks lose millions of liters of clean, treated water every day due to undetected leaks. Traditional methods rely on acoustic sensors and physical inspections, which are slow, expensive, and reactive.

By the time a leak surfaces, the damage is already done. We need a system that can detect and locate leaks instantly, purely from existing SCADA network data.

---

## 🚀 Our Solution: The "Truth Pipeline"

**HydroTrace** is a next-generation dashboard that proves we can take raw water-network data and produce a highly accurate, useful answer.

Instead of a black-box AI, HydroTrace operates on a **Three-Brain Architecture** to ensure trust and explainability:

### 🧠 BRAIN 1: Detection (Is something wrong?)

Continuously analyzes real-time SCADA pressure, flow, and tank level data across the L-TOWN network grid. It identifies statistical anomalies and physical deviations from expected hydraulic baselines to detect the exact moment a leak occurs.

### 🧠 BRAIN 2: Localization (Where is it probably wrong?)

Once a leak is detected, Brain 2 maps the hydraulic fingerprint (pressure drops across specific junctions). Using our narrowing-funnel algorithm, it isolates the probable leak zone down to the specific pipe ID (e.g., \p423\).

### 🧠 BRAIN 3: Verification (Can we prove our guess was correct?)

Compares the predicted leak location and magnitude against physical verification ground truth. This transparent approach builds operator trust and continually improves the underlying model.

---

## 📊 Powered by BattLeDIM Data

HydroTrace is built on the rigorous **BattLeDIM Dataset** (Battle of the Leakage Detection and Isolation Methods), simulating the realistic L-TOWN water network.

The system processes:

- **SCADA Pressures:** Readings from 30+ network junction sensors.
- **SCADA Flows:** Inflow and outflow rates.
- **SCADA Levels:** Tank water levels reflecting network demand.

> **Prototype Notice:** This repository currently runs a high-fidelity client-side data engine (\src/lib/hydrotrace.ts\) that simulates the BattLeDIM L-TOWN network telemetry and hydraulic fingerprints in real-time within the browser.

---

## 🏗️ System Architecture

\\\mermaid
flowchart TD
subgraph Data Sources
P[SCADA Pressures] --> Engine
F[SCADA Flows] --> Engine
L[SCADA Levels] --> Engine
end

    subgraph HydroTrace Engine
        Engine[Hydraulic Data Engine]
        Engine --> B1[Brain 1: Detection]
        B1 -->|Anomaly Trigger| B2[Brain 2: Localization]
        B2 -->|Leak Coordinates| B3[Brain 3: Verification]
    end

    subgraph Dashboard UI
        B1 -.-> UI1[Live Sensor Grid & Probabilities]
        B2 -.-> UI2[Network Topology & Narrowing Funnel]
        B3 -.-> UI3[Prediction vs. Ground Truth Reveal]
    end

    style P fill:#1e3a8a,color:#fff
    style F fill:#1e3a8a,color:#fff
    style L fill:#1e3a8a,color:#fff
    style Engine fill:#0f766e,color:#fff
    style B1 fill:#92400e,color:#fff
    style B2 fill:#92400e,color:#fff
    style B3 fill:#92400e,color:#fff

\\\

---

## ✨ Key Features

- ✅ **Live Detection Dashboard:** Real-time sensor grid monitoring 33 nodes with animated probability charts.
- ✅ **Interactive Network Map:** SVG-based localization map tracking pressure drops to pinpoint faulty pipes.
- ✅ **Narrowing Funnel Analytics:** Visual representation of the AI narrowing down the search space.
- ✅ **Verification Reveal:** Side-by-side comparison of AI predictions vs. actual maintenance ground truth.
- ✅ **Validation Metrics:** Overall performance dashboard calculating Accuracy, Precision, and Mean Distance to Leak.
- ✅ **Modern UX:** Highly interactive, responsive UI built with Framer Motion and Tailwind CSS.
- ✅ **Dark/Light Mode:** Seamless theme switching for control room environments.

---

## 🛠️ Technology Stack

| Layer                  | Technology                                             |
| ---------------------- | ------------------------------------------------------ |
| **Frontend Framework** | React 19 with TanStack Start (file-based routing, SSR) |
| **Language**           | TypeScript 5.8                                         |
| **Styling**            | Tailwind CSS v4 + shadcn/ui components                 |
| **Charts & Graphics**  | Recharts, SVG, Framer Motion                           |
| **Icons**              | Lucide React                                           |
| **Deployment**         | Vercel (Zero-config SSR ready)                         |

---

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation & Run

\\\ash
git clone https://github.com/rajpatel2444/Tech-Water.git
cd Tech-Water
npm install
npm run dev
\\\
_(Server runs locally at \http://localhost:3000\)_

---

## 👥 Project Team

| Name         | Role                                      |
| ------------ | ----------------------------------------- |
| **Aditya**   | Team Leader                               |
| **Divyansh** | Software Development · Technical Director |
| **Anmol**    | Project Director                          |
| **Nitika**   | Design & Sketching                        |
| **Pema**     | Design & Sketching                        |
| **Advaita**  | Presentation & Judge Representative       |

---

<div align="center">
  <b>Built with care for a sustainable water future.</b><br/>
  <i>HydroTrace — Every Drop Accounted For.</i>
</div>
