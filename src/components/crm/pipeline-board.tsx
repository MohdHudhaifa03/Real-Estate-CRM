import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { LeadCard } from "@/components/crm/lead-card";
import { AnimatedValue } from "@/components/crm/stat-card";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/error";
import { useCrm } from "@/lib/crm/store";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

/**
 * Kanban pipeline with HTML5 drag-and-drop plus keyboard/touch move buttons.
 * Every move is undoable to its exact prior stage.
 */
export function PipelineBoard({
  leads,
  onOpenLead,
}: {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
}) {
  const { projects, users, updateLeadStage } = useCrm();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LeadStage | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);
  const movedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    LEAD_STAGES.forEach((s) => map.set(s.id, []));
    leads.forEach((l) => map.get(l.stage)?.push(l));
    return map;
  }, [leads]);

  const move = useCallback(
    (lead: Lead, to: LeadStage) => {
      if (lead.stage === to) return;
      const from = lead.stage;
      const label = LEAD_STAGES.find((s) => s.id === to)?.label ?? to;
      const fromLabel = LEAD_STAGES.find((s) => s.id === from)?.label ?? from;
      void updateLeadStage(lead.id, to)
        .then(() => {
          setMovedId(lead.id);
          if (movedTimer.current) clearTimeout(movedTimer.current);
          movedTimer.current = setTimeout(() => setMovedId(null), 700);
          toast.success(`${lead.name} moved to ${label}`, {
            description: `Previously in ${fromLabel}.`,
            action: {
              label: "Undo",
              onClick: () => {
                void updateLeadStage(lead.id, from, { undo: true }).then(() => {
                  setMovedId(lead.id);
                  toast.info(`${lead.name} restored to ${fromLabel}`);
                });
              },
            },
          });
        })
        .catch((error) => toast.error(getErrorMessage(error)));
    },
    [updateLeadStage],
  );

  const stepStage = useCallback(
    (lead: Lead, direction: -1 | 1) => {
      const index = LEAD_STAGES.findIndex((s) => s.id === lead.stage);
      const next = LEAD_STAGES[index + direction];
      if (!next) return;
      move(lead, next.id);
    },
    [move],
  );

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
      <div className="flex min-w-max gap-4 lg:grid lg:min-w-0 lg:grid-cols-3 xl:grid-cols-6">
        {LEAD_STAGES.map((stage) => {
          const items = byStage.get(stage.id) ?? [];
          const isOver = overStage === stage.id;
          return (
            <section
              key={stage.id}
              aria-label={`${stage.label} stage`}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOverStage(stage.id);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setOverStage(null);
                const id = e.dataTransfer.getData("text/lead-id") || dragId;
                setDragId(null);
                const lead = leads.find((l) => l.id === id);
                if (lead) move(lead, stage.id);
              }}
              className={cn(
                "w-[280px] shrink-0 rounded-2xl border border-border/70 bg-secondary/40 p-3 transition-all duration-300 lg:w-auto",
                isOver && "border-primary/70 bg-primary/8 shadow-lift",
              )}
            >
              <header className="mb-3 flex items-baseline justify-between px-1">
                <div>
                  <h3 className="font-serif text-base text-foreground">{stage.label}</h3>
                  <p className="text-[11px] text-muted-foreground">{stage.hint}</p>
                </div>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground shadow-soft">
                  <AnimatedValue value={String(items.length)} />
                </span>
              </header>

              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                    Drop a lead here
                  </p>
                ) : (
                  items.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      project={projects.find((p) => p.id === lead.interestedProjectId)}
                      owner={users.find((u) => u.id === lead.ownerId)}
                      onOpen={onOpenLead}
                      justMoved={movedId === lead.id}
                      dragging={dragId === lead.id}
                      draggableProps={{
                        draggable: true,
                        onDragStart: (e: React.DragEvent) => {
                          e.dataTransfer.setData("text/lead-id", lead.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(lead.id);
                        },
                        onDragEnd: () => {
                          setDragId(null);
                          setOverStage(null);
                        },
                      }}
                      footer={
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <GripVertical className="size-3" /> Drag or use arrows
                          </span>
                          <span className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              aria-label={`Move ${lead.name} to previous stage`}
                              disabled={LEAD_STAGES[0]!.id === lead.stage}
                              onClick={() => stepStage(lead, -1)}
                            >
                              <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              aria-label={`Move ${lead.name} to next stage`}
                              disabled={LEAD_STAGES[LEAD_STAGES.length - 1]!.id === lead.stage}
                              onClick={() => stepStage(lead, 1)}
                            >
                              <ChevronRight className="size-4" />
                            </Button>
                          </span>
                        </div>
                      }
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
