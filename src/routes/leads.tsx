import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/crm/app-shell";
import { BookingDialog } from "@/components/crm/booking-dialog";
import { LeadDetailSheet } from "@/components/crm/lead-detail-sheet";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/crm/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money, relativeDays } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/crm/types";

export const Route = createFileRoute("/leads")({
  validateSearch: (search: Record<string, unknown>) => ({
    stage: (typeof search.stage === "string" ? search.stage : "all") as LeadStage | "all",
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Lead pipeline — Aurelia Residences CRM" },
      {
        name: "description",
        content:
          "Search, filter and drag leads through every pipeline stage, then book units without leaving the board.",
      },
      { property: "og:title", content: "Lead pipeline — Aurelia Residences CRM" },
      {
        property: "og:description",
        content: "A drag-and-drop pipeline for enquiries, viewings and reservations.",
      },
    ],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const { stage, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/leads" });
  const { status, retry, visibleLeads, projects, users, user } = useCrm();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [bookingLead, setBookingLead] = useState<Lead | null>(null);
  const [source, setSource] = useState("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return visibleLeads.filter((l) => {
      if (stage !== "all" && l.stage !== stage) return false;
      if (source !== "all" && l.source !== source) return false;
      if (!term) return true;
      return [l.name, l.email, l.phone].some((v) => v.toLowerCase().includes(term));
    });
  }, [q, source, stage, visibleLeads]);

  const live = selected ? visibleLeads.find((l) => l.id === selected.id) ?? null : null;

  return (
    <AppShell
      title="Lead pipeline"
      description={
        user?.role === "admin" ? "Every lead across the sales team" : "Leads assigned to you"
      }
      actions={
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Add lead
        </Button>
      }
    >
      {status === "error" ? (
        <ErrorState onRetry={retry} />
      ) : status === "loading" ? (
        <LoadingBlock rows={6} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) =>
                  navigate({ search: (prev) => ({ ...prev, q: e.target.value }) })
                }
                placeholder="Search name, email or phone"
                className="pl-9"
                aria-label="Search leads"
              />
            </div>
            <Select
              value={stage}
              onValueChange={(v) =>
                navigate({ search: (prev) => ({ ...prev, stage: v as LeadStage | "all" }) })
              }
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {["Website", "Referral", "Walk-in", "Campaign", "Broker"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">{filtered.length} shown</Badge>
          </div>

          <Tabs defaultValue="board">
            <TabsList>
              <TabsTrigger value="board">Pipeline</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="pt-5">
              {filtered.length === 0 ? (
                <EmptyState
                  title="No leads match"
                  description="Adjust the filters or add a new enquiry to get started."
                  action={
                    <Button onClick={() => setAddOpen(true)}>
                      <UserPlus className="size-4" /> Add lead
                    </Button>
                  }
                />
              ) : (
                <PipelineBoard leads={filtered} onOpenLead={setSelected} />
              )}
            </TabsContent>

            <TabsContent value="table" className="pt-5">
              {filtered.length === 0 ? (
                <EmptyState
                  title="No leads match"
                  description="Try clearing the search or stage filter."
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead className="hidden md:table-cell">Project</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead className="hidden sm:table-cell">Budget</TableHead>
                        <TableHead className="hidden lg:table-cell">Owner</TableHead>
                        <TableHead className="hidden lg:table-cell">Added</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((lead) => (
                        <TableRow key={lead.id} className="transition-colors hover:bg-secondary/40">
                          <TableCell>
                            <span className="block text-foreground">{lead.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {lead.phone}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {projects.find((p) => p.id === lead.interestedProjectId)?.name ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {LEAD_STAGES.find((s) => s.id === lead.stage)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {money(lead.budget)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {users.find((u) => u.id === lead.ownerId)?.name}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {relativeDays(lead.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelected(lead)}>
                              Open
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <LeadFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <LeadDetailSheet
        lead={live}
        onOpenChange={(open) => !open && setSelected(null)}
        onBook={(lead) => {
          setSelected(null);
          setBookingLead(lead);
        }}
      />
      <BookingDialog
        open={!!bookingLead}
        onOpenChange={(open) => !open && setBookingLead(null)}
        presetLeadId={bookingLead?.id}
      />
    </AppShell>
  );
}
