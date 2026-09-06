import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CalendarCheck, Users, Wallet } from "lucide-react";

import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { AppShell } from "@/components/crm/app-shell";
import { StatCard } from "@/components/crm/stat-card";
import { ErrorState, LoadingBlock } from "@/components/crm/states";
import { TiltCard } from "@/components/crm/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactMoney, money } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";
import { LEAD_STAGES } from "@/lib/crm/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sales dashboard — Aurelia Residences CRM" },
      {
        name: "description",
        content:
          "Live pipeline value, active leads, unit availability and booking activity for the Aurelia sales team.",
      },
      { property: "og:title", content: "Sales dashboard — Aurelia Residences CRM" },
      {
        property: "og:description",
        content: "Live pipeline value, active leads, availability and bookings at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { status, retry, visibleLeads, visibleBookings, units, projects, user, leads } = useCrm();

  const openLeads = visibleLeads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const pipelineValue = openLeads.reduce((sum, l) => sum + l.budget, 0);
  const available = units.filter((u) => u.status === "available").length;
  const activeBookings = visibleBookings.filter((b) => b.status !== "cancelled");
  const recentActivity = visibleLeads
    .flatMap((l) => l.activity.map((a) => ({ ...a, lead: l.name })))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  return (
    <AppShell
      title={`Good day, ${user?.name.split(" ")[0] ?? "there"}`}
      description={
        user?.role === "admin"
          ? "Team-wide view of every lead, unit and booking"
          : "Your leads, viewings and bookings"
      }
      actions={
        <Button asChild>
          <Link to="/leads">Open pipeline</Link>
        </Button>
      }
    >
      {status === "error" ? (
        <ErrorState onRetry={retry} />
      ) : status === "loading" ? (
        <LoadingBlock rows={5} />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open leads"
              value={String(openLeads.length)}
              hint={`${visibleLeads.length} total in your view`}
              icon={Users}
              to="/leads"
            />
            <StatCard
              label="Pipeline value"
              value={compactMoney(pipelineValue)}
              hint="Sum of open lead budgets"
              icon={Wallet}
              tone="navy"
              to="/leads"
            />
            <StatCard
              label="Units available"
              value={String(available)}
              hint={`${units.length} units across ${projects.length} projects`}
              icon={Building2}
              tone="success"
              to="/projects"
            />
            <StatCard
              label="Active bookings"
              value={String(activeBookings.length)}
              hint="Held and confirmed"
              icon={CalendarCheck}
              tone="warning"
              to="/bookings"
            />
          </div>

          <section className="grid gap-6 lg:grid-cols-3">
            <TiltCard className="p-5 lg:col-span-2" max={3} lift={6}>
              <h2 className="font-serif text-2xl">Pipeline by stage</h2>
              <p className="text-sm text-muted-foreground">Tap a stage to work its leads.</p>
              <div className="mt-5 space-y-3">
                {LEAD_STAGES.map((stage) => {
                  const items = visibleLeads.filter((l) => l.stage === stage.id);
                  const pct = visibleLeads.length
                    ? Math.round((items.length / visibleLeads.length) * 100)
                    : 0;
                  return (
                    <Link
                      key={stage.id}
                      to="/leads"
                      search={{ stage: stage.id }}
                      className="block rounded-xl px-3 py-2 transition-colors hover:bg-secondary/60"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{stage.label}</span>
                        <span className="text-muted-foreground">
                          {items.length} · {compactMoney(items.reduce((s, l) => s + l.budget, 0))}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gradient-warm transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </TiltCard>

            <TiltCard className="p-5" max={3} lift={6}>
              <h2 className="font-serif text-2xl">Projects</h2>
              <div className="mt-4 space-y-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/60"
                  >
                    <img
                      src={p.cover}
                      alt={p.name}
                      loading="lazy"
                      width={80}
                      height={60}
                      className="size-14 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        from {money(p.priceFrom)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </TiltCard>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-serif text-2xl">Latest activity</h2>
              <Badge variant="outline">
                {user?.role === "admin" ? `${leads.length} leads tracked` : "Your leads"}
              </Badge>
            </div>
            <ActivityTimeline items={recentActivity} />
          </section>
        </div>
      )}
    </AppShell>
  );
}
