"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/crm/app-shell";
import { BookingDialog } from "@/components/crm/booking-dialog";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/crm/states";
import { TiltCard } from "@/components/crm/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, shortDate } from "@/lib/crm/format";
import { getErrorMessage } from "@/lib/api/error";
import { useCrm } from "@/lib/crm/store";

export default function BookingsPage() {
  const { visibleBookings, units, leads, users, projects, status, retry, confirmBooking, cancelBooking, user } =
    useCrm();
  const [open, setOpen] = useState(false);

  return (
    <AppShell
      title="Bookings"
      description={user?.role === "admin" ? "Every reservation held by the team" : "Your reservations"}
      actions={
        <Button onClick={() => setOpen(true)}>
          <CalendarPlus className="size-4" /> New booking
        </Button>
      }
    >
      {status === "error" ? (
        <ErrorState onRetry={retry} />
      ) : status === "loading" ? (
        <LoadingBlock rows={3} />
      ) : visibleBookings.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Hold a unit for a lead and it will appear here instantly."
          action={<Button onClick={() => setOpen(true)}>Create a booking</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleBookings.map((booking) => {
            const unit = units.find((u) => u.id === booking.unitId);
            const lead = leads.find((l) => l.id === booking.leadId);
            const project = projects.find((p) => p.id === unit?.projectId);
            return (
              <TiltCard key={booking.id} className="card-sheen p-5" max={5} lift={9}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl leading-tight">{unit?.code ?? "Unit"}</h2>
                    <p className="text-xs text-muted-foreground">
                      {project?.name} · {unit?.type}
                    </p>
                  </div>
                  <Badge
                    variant={booking.status === "cancelled" ? "outline" : "secondary"}
                    className="capitalize"
                  >
                    {booking.status}
                  </Badge>
                </div>
                <dl className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Lead</dt>
                    <dd>{lead?.name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Agent</dt>
                    <dd>{users.find((u) => u.id === booking.agentId)?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Visit</dt>
                    <dd>{shortDate(booking.visitDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Value</dt>
                    <dd className="font-serif text-base">{money(booking.amount)}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={booking.status !== "held"}
                    onClick={() => {
                      void confirmBooking(booking.id)
                        .then(() => toast.success(`Booking for ${unit?.code} confirmed`))
                        .catch((error) => toast.error(getErrorMessage(error)));
                    }}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={booking.status === "cancelled"}
                    onClick={() => {
                      void cancelBooking(booking.id)
                        .then(() => toast.info(`${unit?.code} released back to available`))
                        .catch((error) => toast.error(getErrorMessage(error)));
                    }}
                  >
                    Cancel
                  </Button>
                  {project ? (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/projects/${project.id}`}>
                        View project
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </TiltCard>
            );
          })}
        </div>
      )}

      <BookingDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}
