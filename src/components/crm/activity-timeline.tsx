import {
  ArrowRightLeft,
  CalendarCheck,
  History,
  PencilLine,
  PhoneCall,
  Sparkles,
  StickyNote,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LEAD_STAGES, type ActivityKind, type LeadActivity } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

const meta: Record<ActivityKind, { icon: LucideIcon; label: string; tone: string }> = {
  created: { icon: Sparkles, label: "Created", tone: "bg-primary/12 text-primary" },
  stage: { icon: ArrowRightLeft, label: "Stage move", tone: "bg-navy/12 text-navy" },
  undo: { icon: History, label: "Undo", tone: "bg-warning/25 text-warning-foreground" },
  note: { icon: StickyNote, label: "Note", tone: "bg-secondary text-secondary-foreground" },
  call: { icon: PhoneCall, label: "Call", tone: "bg-secondary text-secondary-foreground" },
  booking: { icon: CalendarCheck, label: "Booking", tone: "bg-success/15 text-success" },
  assign: { icon: UserCog, label: "Assignment", tone: "bg-accent text-accent-foreground" },
  edit: { icon: PencilLine, label: "Edit", tone: "bg-secondary text-secondary-foreground" },
};

function stageLabel(id?: string) {
  return LEAD_STAGES.find((s) => s.id === id)?.label;
}

function timestamp(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimeline({ items }: { items: LeadActivity[] }) {
  const ordered = [...items].sort((a, b) => +new Date(b.at) - +new Date(a.at));

  if (ordered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
        <p className="font-serif text-lg text-foreground">Nothing logged yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Calls, stage moves and bookings will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <ol aria-label="Lead activity timeline" className="relative space-y-4 pl-2">
      <span
        aria-hidden="true"
        className="absolute left-[19px] top-2 bottom-2 w-px bg-border"
      />
      {ordered.map((item) => {
        const m = meta[item.kind];
        const Icon = m.icon;
        const from = stageLabel(item.fromStage);
        const to = stageLabel(item.toStage);
        return (
          <li key={item.id} className="rise-in relative flex gap-3">
            <span
              className={cn(
                "z-10 mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ring-4 ring-background",
                m.tone,
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-card p-3 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {m.label}
                </Badge>
                {from && to ? (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    {from} <ArrowRightLeft className="size-3" aria-hidden="true" /> {to}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 break-words text-sm text-foreground">{item.text}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{item.by}</span>
                {" · "}
                <time dateTime={item.at}>{timestamp(item.at)}</time>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
