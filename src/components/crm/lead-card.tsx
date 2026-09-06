import { Building2, Mail, Phone } from "lucide-react";

import { TiltCard } from "@/components/crm/tilt-card";
import { Badge } from "@/components/ui/badge";
import { compactMoney, relativeDays } from "@/lib/crm/format";
import type { Lead, Project, User } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export function LeadCard({
  lead,
  project,
  owner,
  onOpen,
  justMoved,
  dragging,
  draggableProps,
  footer,
}: {
  lead: Lead;
  project?: Project | undefined;
  owner?: User | undefined;
  onOpen: (lead: Lead) => void;
  justMoved?: boolean;
  dragging?: boolean;
  draggableProps?: Record<string, unknown>;
  footer?: React.ReactNode;
}) {
  return (
    <TiltCard
      max={5}
      lift={8}
      className={cn(
        "card-sheen p-4",
        justMoved && "stage-settle",
        dragging && "opacity-60 ring-2 ring-primary/60",
      )}
      {...draggableProps}
    >
      <button
        type="button"
        onClick={() => onOpen(lead)}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Open ${lead.name}`}
      >
        <div className="tilt-layer" style={{ ["--tilt-depth" as string]: "16px" }}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-lg leading-tight text-foreground">{lead.name}</p>
            <Badge variant="secondary" className="shrink-0 text-[11px]">
              {compactMoney(lead.budget)}
            </Badge>
          </div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3" />
              {project?.name ?? "No project yet"}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="size-3" />
              {lead.phone}
            </span>
            <span className="flex items-center gap-1.5 truncate">
              <Mail className="size-3" />
              {lead.email}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{owner?.name ?? "Unassigned"}</span>
            <span>{relativeDays(lead.createdAt)}</span>
          </div>
        </div>
      </button>
      {footer ? <div className="mt-3 border-t border-border/60 pt-3">{footer}</div> : null}
    </TiltCard>
  );
}
