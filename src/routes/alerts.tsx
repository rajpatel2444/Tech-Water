import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/hydrotrace/page-shell";
import { PageHeader } from "@/components/hydrotrace/page-header";
import { AlertRow } from "@/components/hydrotrace/alert-row";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimulation } from "@/hooks/use-simulation";
import type { AlertSeverity } from "@/types/hydrotrace";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "System Alerts | HydroTrace" },
      {
        name: "description",
        content:
          "Active HydroTrace alerts for leaks, high TDS, low water level, offline sensors and tank capacity events.",
      },
      { property: "og:title", content: "System Alerts | HydroTrace" },
      {
        property: "og:description",
        content: "Info, warning and critical alerts across both water loops.",
      },
    ],
  }),
  component: AlertsPage,
});

const filters: { id: "all" | AlertSeverity; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
];

function AlertsPage() {
  const { alerts, clearAlerts } = useSimulation();

  return (
    <PageShell>
      <PageHeader
        title="Alerts"
        subtitle="Severity-ranked events raised by the simulation engine."
        actions={
          <Button variant="outline" size="sm" onClick={clearAlerts}>
            Clear all
          </Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          {filters.map((f) => (
            <TabsTrigger key={f.id} value={f.id}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {filters.map((f) => {
          const list = f.id === "all" ? alerts : alerts.filter((a) => a.severity === f.id);
          return (
            <TabsContent key={f.id} value={f.id} className="mt-8 space-y-6">
              <AnimatePresence initial={false}>
                {list.map((a) => (
                  <AlertRow key={a.id} alert={a} />
                ))}
              </AnimatePresence>
              {list.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing here right now.</p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </PageShell>
  );
}
