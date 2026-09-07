"use client";

import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  Eye,
  Phone,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { AppShell } from "@/components/crm/app-shell";
import { StatCard } from "@/components/crm/stat-card";
import { ErrorState, LoadingBlock } from "@/components/crm/states";
import { TiltCard } from "@/components/crm/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactMoney, money, shortDate, relativeDays, followUpLabel } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";
import { isClosedStage, LEAD_STAGES } from "@/lib/crm/types";

export default function DashboardPage() {
  const { status, retry, visibleLeads, visibleBookings, units, projects, user, leads, users } =
    useCrm();

  const openLeads = visibleLeads.filter((l) => !isClosedStage(l.stage));
  const pipelineValue = openLeads.reduce((sum, l) => sum + l.budget, 0);
  const available = units.filter((u) => u.status === "available").length;
  const activeBookings = visibleBookings.filter((b) => b.status !== "cancelled");
  const recentActivity = visibleLeads
    .flatMap((l) => l.activity.map((a) => ({ ...a, lead: l.name })))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  const today = new Date().toISOString().slice(0, 10);
  const followUpLeads = visibleLeads
    .filter((l) => l.followUpDate && l.followUpDate <= today && !isClosedStage(l.stage))
    .sort((a, b) => String(a.followUpDate).localeCompare(String(b.followUpDate)))
    .slice(0, 6);

  /* ── New leads awaiting first contact ── */
  const newLeads = visibleLeads.filter((l) => l.stage === "new");

  /* ── Upcoming visits from bookings ── */
  const upcomingVisits = activeBookings
    .filter((b) => new Date(b.visitDate) >= new Date())
    .sort((a, b) => +new Date(a.visitDate) - +new Date(b.visitDate))
    .slice(0, 4);

  /* ── Conversion stats ── */
  const bookedLeads = visibleLeads.filter((l) => l.stage === "booked").length;
  const lostLeads = visibleLeads.filter((l) => l.stage === "lost").length;
  const closedLeads = bookedLeads + lostLeads;
  const conversionRate = closedLeads > 0 ? Math.round((bookedLeads / closedLeads) * 100) : 0;
  const totalBookingValue = activeBookings.reduce((sum, b) => sum + b.amount, 0);

  return (
    <AppShell
      title={`Good day, ${user?.name.split(" ")[0] ?? "there"}`}
      description={
        user?.role === "admin"
          ? "Team-wide view of every lead, unit and booking"
          : "Your leads, follow-ups and bookings"
      }
      actions={
        <Button asChild>
          <Link href="/leads">Open pipeline</Link>
        </Button>
      }
    >
      {status === "error" ? (
        <ErrorState onRetry={retry} />
      ) : status === "loading" ? (
        <LoadingBlock rows={5} />
      ) : (
        <div className="space-y-8">
          {/* ── KPI cards row ── */}
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

          {/* ── Secondary stats row ── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <TiltCard className="flex items-center gap-4 p-4" max={3} lift={4}>
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-warm text-white">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conversion rate</p>
                <p className="font-serif text-2xl">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {bookedLeads} booked / {closedLeads} closed
                </p>
              </div>
            </TiltCard>

            <TiltCard className="flex items-center gap-4 p-4" max={3} lift={4}>
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-navy text-white">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking revenue</p>
                <p className="font-serif text-2xl">{compactMoney(totalBookingValue)}</p>
                <p className="text-xs text-muted-foreground">
                  {activeBookings.length} active bookings
                </p>
              </div>
            </TiltCard>

            <TiltCard className="flex items-center gap-4 p-4" max={3} lift={4}>
              <div className="flex size-11 items-center justify-center rounded-xl bg-success text-white">
                <UserPlus className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New leads</p>
                <p className="font-serif text-2xl">{newLeads.length}</p>
                <p className="text-xs text-muted-foreground">
                  Awaiting first contact
                </p>
              </div>
            </TiltCard>
          </div>

          {/* ── Follow-ups & Upcoming visits ── */}
          <section className="grid gap-6 lg:grid-cols-2">
            {/* Follow-up leads */}
            <TiltCard className="p-5" max={3} lift={6}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Follow-ups needed</h2>
                <Badge variant="outline" className="gap-1">
                  <Phone className="size-3" />
                  {followUpLeads.length}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Leads with a follow-up date on or before today.
              </p>
              {followUpLeads.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  No follow-ups due — you&#39;re all caught up.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {followUpLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads?stage=${lead.stage}`}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {lead.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lead.followUpDate ? followUpLabel(lead.followUpDate) : relativeDays(lead.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {LEAD_STAGES.find((s) => s.id === lead.stage)?.label ?? lead.stage}
                        </Badge>
                        <span className="text-xs font-medium text-foreground">
                          {compactMoney(lead.budget)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TiltCard>

            {/* Upcoming visits / bookings */}
            <TiltCard className="p-5" max={3} lift={6}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Upcoming visits</h2>
                <Badge variant="outline" className="gap-1">
                  <CalendarClock className="size-3" />
                  {upcomingVisits.length}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Scheduled site visits and booking appointments.
              </p>
              {upcomingVisits.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  No upcoming visits scheduled.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {upcomingVisits.map((booking) => {
                    const unit = units.find((u) => u.id === booking.unitId);
                    const lead = visibleLeads.find((l) => l.id === booking.leadId);
                    const agent = users.find((u) => u.id === booking.agentId);
                    return (
                      <Link
                        key={booking.id}
                        href="/bookings"
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {unit?.code ?? "—"} · {lead?.name ?? "Unknown lead"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Agent: {agent?.name ?? "—"} · {shortDate(booking.visitDate)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={booking.status === "confirmed" ? "default" : "secondary"}
                            className="capitalize text-xs"
                          >
                            {booking.status}
                          </Badge>
                          <span className="text-xs font-medium text-foreground">
                            {compactMoney(booking.amount)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </TiltCard>
          </section>

          {/* ── Pipeline by stage + Projects ── */}
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
                      href={`/leads?stage=${stage.id}`}
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
                {projects.map((p) => {
                  const projectUnits = units.filter((u) => u.projectId === p.id);
                  const projectAvailable = projectUnits.filter(
                    (u) => u.status === "available"
                  ).length;
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
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
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">{p.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          from {money(p.priceFrom)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {projectAvailable}/{projectUnits.length} units available
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </TiltCard>
          </section>

          {/* ── New leads awaiting contact ── */}
          {newLeads.length > 0 && (
            <section>
              <TiltCard className="p-5" max={3} lift={6}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl">New leads — awaiting contact</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      These leads haven&#39;t been contacted yet. Reach out soon!
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/leads?stage=new">
                      View all
                    </Link>
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {newLeads.slice(0, 6).map((lead) => {
                    const project = projects.find((p) => p.id === lead.interestedProjectId);
                    return (
                      <div
                        key={lead.id}
                        className="rounded-xl border border-border/60 bg-card p-3 shadow-soft transition-shadow hover:shadow-lift"
                      >
                        <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{lead.email}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {lead.source}
                          </Badge>
                          <span className="text-xs font-medium">{compactMoney(lead.budget)}</span>
                        </div>
                        {project && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3" />
                            Interested in {project.name}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Created {relativeDays(lead.createdAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </TiltCard>
            </section>
          )}

          {/* ── Latest activity ── */}
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
