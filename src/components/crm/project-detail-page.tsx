"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/crm/app-shell";
import { BookingDialog } from "@/components/crm/booking-dialog";
import { SitePlan } from "@/components/crm/site-plan";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/crm/states";
import { TiltCard } from "@/components/crm/tilt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";
import type { Unit } from "@/lib/crm/types";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, units, status, retry } = useCrm();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [bookingUnitId, setBookingUnitId] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  if (status === "error") {
    return (
      <AppShell title="Project">
        <ErrorState onRetry={retry} />
      </AppShell>
    );
  }
  if (status === "loading") {
    return (
      <AppShell title="Project">
        <LoadingBlock rows={5} />
      </AppShell>
    );
  }

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <AppShell title="Project not found">
        <EmptyState
          title="That project isn't here"
          description="It may have been renamed or removed."
          action={
            <Button asChild>
              <Link href="/projects">Back to projects</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }
  
  const own = units.filter((u) => u.projectId === project.id);
  const available = own.filter((u) => u.status === "available");

  return (
    <AppShell
      title={project.name}
      description={`${project.district}, ${project.city} · handover ${project.handover}`}
      actions={
        <Button variant="outline" asChild>
          <Link href="/projects">
            <ArrowLeft className="size-4" /> All projects
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <TiltCard className="overflow-hidden" max={4} lift={10}>
            <img
              src={project.gallery[heroIndex] ?? project.cover}
              alt={`${project.name} view ${heroIndex + 1}`}
              width={1200}
              height={800}
              className="h-[300px] w-full object-cover lg:h-[420px]"
            />
            <div className="flex gap-2 p-3">
              {project.gallery.map((g, i) => (
                <button
                  key={g + i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === heroIndex}
                  className={`overflow-hidden rounded-lg border-2 transition-all ${
                    i === heroIndex ? "border-primary" : "border-transparent opacity-70"
                  }`}
                >
                  <img src={g} alt="" loading="lazy" width={120} height={80} className="h-14 w-20 object-cover" />
                </button>
              ))}
            </div>
          </TiltCard>

          <TiltCard className="p-5" max={4} lift={8}>
            <h2 className="font-serif text-2xl">About this development</h2>
            <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.amenities.map((a) => (
                <Badge key={a} variant="secondary">
                  {a}
                </Badge>
              ))}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">From</dt>
                <dd className="font-serif text-xl">{money(project.priceFrom)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Availability
                </dt>
                <dd className="font-serif text-xl">
                  {available.length}/{own.length}
                </dd>
              </div>
            </dl>
            <Button
              className="mt-5 w-full"
              disabled={available.length === 0}
              onClick={() => setBookingUnitId(available[0]?.id ?? null)}
            >
              <CalendarPlus className="size-4" /> Book a unit here
            </Button>
          </TiltCard>
        </div>

        <Tabs defaultValue="plan">
          <TabsList>
            <TabsTrigger value="plan">Master site plan</TabsTrigger>
            <TabsTrigger value="units">Unit list</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="pt-5">
            <SitePlan
              units={own}
              blocks={project.blocks}
              selectedUnitId={selectedUnit?.id}
              onSelect={setSelectedUnit}
            />
            {selectedUnit ? (
              <TiltCard className="mt-5 p-5" max={3} lift={6}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-2xl">{selectedUnit.code}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedUnit.type} · {selectedUnit.areaSqm} m² · Floor {selectedUnit.floor} ·{" "}
                      {selectedUnit.view}
                    </p>
                    <p className="mt-1 font-serif text-xl">{money(selectedUnit.price)}</p>
                  </div>
                  <Button
                    disabled={selectedUnit.status !== "available"}
                    onClick={() => setBookingUnitId(selectedUnit.id)}
                  >
                    {selectedUnit.status === "available"
                      ? "Book this unit"
                      : `Unit ${selectedUnit.status}`}
                  </Button>
                </div>
              </TiltCard>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Select a plot on the plan to see pricing and book it.
              </p>
            )}
          </TabsContent>

          <TabsContent value="units" className="pt-5">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Area</TableHead>
                    <TableHead className="hidden md:table-cell">View</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {own.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>{unit.code}</TableCell>
                      <TableCell>{unit.type}</TableCell>
                      <TableCell className="hidden sm:table-cell">{unit.areaSqm} m²</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {unit.view}
                      </TableCell>
                      <TableCell>{money(unit.price)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={unit.status === "available" ? "secondary" : "outline"}
                          className="capitalize"
                        >
                          {unit.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={unit.status !== "available"}
                          onClick={() => setBookingUnitId(unit.id)}
                        >
                          Book
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BookingDialog
        open={!!bookingUnitId}
        onOpenChange={(open) => !open && setBookingUnitId(null)}
        presetUnitId={bookingUnitId ?? undefined}
      />
    </AppShell>
  );
}
