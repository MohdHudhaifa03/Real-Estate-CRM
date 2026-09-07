"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/crm/app-shell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/crm/states";
import { TiltCard } from "@/components/crm/tilt-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactMoney } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";
import { isClosedStage } from "@/lib/crm/types";

export default function TeamPage() {
  const { users, leads, bookings, user, status, retry } = useCrm();

  if (user && user.role !== "admin") {
    return (
      <AppShell title="Team performance">
        <EmptyState
          icon={<ShieldAlert className="size-5" />}
          title="Admin access only"
          description="Team performance is visible to administrators. Log in with an Admin account to view it."
          action={
            <Button asChild>
              <Link href="/leads">Back to my leads</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell title="Team performance" description="Pipeline and reservations by consultant">
      {status === "error" ? (
        <ErrorState onRetry={retry} />
      ) : status === "loading" ? (
        <LoadingBlock rows={3} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {users.map((member) => {
            const own = leads.filter((l) => l.ownerId === member.id);
            const booked = own.filter((l) => l.stage === "booked").length;
            const open = own.filter((l) => !isClosedStage(l.stage));
            const held = bookings.filter(
              (b) => b.agentId === member.id && b.status !== "cancelled",
            ).length;
            return (
              <TiltCard key={member.id} className="card-sheen p-5" max={5} lift={9}>
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-serif text-xl leading-tight">{member.name}</h2>
                    <p className="text-xs text-muted-foreground">{member.title}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto capitalize">
                    {member.role}
                  </Badge>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <dd className="font-serif text-2xl">{open.length}</dd>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Open
                    </dt>
                  </div>
                  <div>
                    <dd className="font-serif text-2xl">{booked}</dd>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Booked
                    </dt>
                  </div>
                  <div>
                    <dd className="font-serif text-2xl">{held}</dd>
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Bookings
                    </dt>
                  </div>
                </dl>
                <p className="mt-4 text-sm text-muted-foreground">
                  Pipeline value {compactMoney(open.reduce((s, l) => s + l.budget, 0))}
                </p>
              </TiltCard>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
