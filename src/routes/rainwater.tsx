import { createFileRoute } from "@tanstack/react-router";
import { TankPage } from "@/components/hydrotrace/tank-page";

export const Route = createFileRoute("/rainwater")({
  head: () => ({
    meta: [
      { title: "Rainwater Tank Monitoring | HydroTrace" },
      {
        name: "description",
        content:
          "Live rainwater harvesting telemetry: level, pH, TDS, turbidity, flow and reuse recommendations.",
      },
      { property: "og:title", content: "Rainwater Tank Monitoring | HydroTrace" },
      {
        property: "og:description",
        content: "Live rainwater tank sensors, quality score and routing recommendations.",
      },
    ],
  }),
  component: () => <TankPage tankId="rainwater" />,
});
