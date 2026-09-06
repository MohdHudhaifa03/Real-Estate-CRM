import { CalendarPlus, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ActivityTimeline } from "@/components/crm/activity-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { money, shortDate } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/crm/types";

export function LeadDetailSheet({
  lead,
  onOpenChange,
  onBook,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  onBook: (lead: Lead) => void;
}) {
  const {
    projects,
    users,
    user,
    updateLeadStage,
    addLeadNote,
    updateLeadContact,
    reassignLead,
    bookings,
    units,
  } = useCrm();
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", budget: "" });
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;
    setDraft({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      budget: String(lead.budget),
    });
    setEditError(null);
  }, [lead]);

  if (!lead) return null;
  const current = lead;
  const project = projects.find((p) => p.id === current.interestedProjectId);
  const owner = users.find((u) => u.id === current.ownerId);
  const leadBookings = bookings.filter((b) => b.leadId === current.id);

  function saveDetails() {
    if (draft.name.trim().length < 2) return setEditError("Enter the full name.");
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) return setEditError("Enter a valid email.");
    if (draft.phone.trim().length < 7) return setEditError("Enter a reachable phone number.");
    const budget = Number(draft.budget);
    if (!Number.isFinite(budget) || budget < 10000)
      return setEditError("Budget must be at least $10,000.");
    setEditError(null);
    updateLeadContact(current.id, {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      budget,
    });
    toast.success("Lead details updated");
  }

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-serif text-3xl">{current.name}</SheetTitle>
          <SheetDescription>
            {current.source} lead · added {shortDate(current.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-10">
          <div className="grid gap-2 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
            <a
              className="flex items-center gap-2 text-sm hover:text-primary"
              href={`tel:${current.phone.replace(/\s/g, "")}`}
            >
              <Phone className="size-4" /> {current.phone}
            </a>
            <a
              className="flex items-center gap-2 text-sm hover:text-primary"
              href={`mailto:${current.email}`}
            >
              <Mail className="size-4" /> {current.email}
            </a>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{money(current.budget)} budget</Badge>
              <Badge variant="outline">{project?.name ?? "No project"}</Badge>
              <Badge variant="outline">{owner?.name ?? "Unassigned"}</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                Pipeline stage
              </Label>
              <Select
                value={current.stage}
                onValueChange={(v) => {
                  const from = current.stage;
                  updateLeadStage(current.id, v as LeadStage);
                  const label = LEAD_STAGES.find((s) => s.id === v)?.label ?? v;
                  toast.success(`${current.name} moved to ${label}`, {
                    action: {
                      label: "Undo",
                      onClick: () => updateLeadStage(current.id, from, { undo: true }),
                    },
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                Assigned agent
              </Label>
              <Select
                value={current.ownerId}
                disabled={user?.role !== "admin"}
                onValueChange={(v) => {
                  reassignLead(current.id, v);
                  toast.success("Lead reassigned");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full" onClick={() => onBook(current)}>
            <CalendarPlus className="size-4" /> Book a unit for this lead
          </Button>

          <Tabs defaultValue="activity">
            <TabsList className="w-full">
              <TabsTrigger value="activity" className="flex-1">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex-1">
                Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Log a call, viewing or follow-up…"
                  aria-label="New activity note"
                />
                <Button
                  variant="outline"
                  disabled={note.trim().length < 3}
                  onClick={() => {
                    addLeadNote(current.id, note.trim());
                    setNote("");
                    toast.success("Activity logged");
                  }}
                >
                  Add to timeline
                </Button>
              </div>
              <ActivityTimeline items={current.activity} />
            </TabsContent>

            <TabsContent value="details" className="space-y-3 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Full name
                  </Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Phone
                  </Label>
                  <Input
                    value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Budget (USD)
                  </Label>
                  <Input
                    inputMode="numeric"
                    value={draft.budget}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, budget: e.target.value.replace(/[^\d]/g, "") }))
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    Interested project
                  </Label>
                  <Select
                    value={current.interestedProjectId ?? ""}
                    onValueChange={(v) => {
                      updateLeadContact(current.id, { interestedProjectId: v });
                      toast.success("Interested project updated");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editError ? (
                <p role="alert" className="text-sm text-destructive">
                  {editError}
                </p>
              ) : null}
              <p className="rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
                {current.notes || "No brief captured yet."}
              </p>
              <Button onClick={saveDetails}>Save details</Button>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-3 pt-4">
              {leadBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings for this lead yet.</p>
              ) : (
                leadBookings.map((b) => {
                  const unit = units.find((u) => u.id === b.unitId);
                  return (
                    <div key={b.id} className="rounded-xl border border-border/70 p-3 text-sm">
                      <p className="font-medium">{unit?.code ?? b.unitId}</p>
                      <p className="text-muted-foreground">
                        {b.status} · visit {shortDate(b.visitDate)} · {money(b.amount)}
                      </p>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
