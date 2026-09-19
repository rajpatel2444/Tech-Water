import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/hydrotrace/page-shell";
import { PageHeader } from "@/components/hydrotrace/page-header";
import { EventLog } from "@/components/hydrotrace/event-log";
import { useSimulation } from "@/hooks/use-simulation";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Event History | HydroTrace" },
      {
        name: "description",
        content:
          "Chronological HydroTrace event history: routing decisions, sensor updates, leaks and recommendation changes.",
      },
      { property: "og:title", content: "Event History | HydroTrace" },
      {
        property: "og:description",
        content: "Full session timeline of HydroTrace system events.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { events } = useSimulation();

  return (
    <PageShell>
      <PageHeader
        title="History"
        subtitle={`${events.length} events recorded in this simulation session.`}
      />
      <EventLog limit={120} title="Session Timeline" />
    </PageShell>
  );
}
