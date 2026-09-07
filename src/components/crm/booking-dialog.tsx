import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { money } from "@/lib/crm/format";
import { useCrm } from "@/lib/crm/store";

export function BookingDialog({
  open,
  onOpenChange,
  presetUnitId,
  presetLeadId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetUnitId?: string | undefined;
  presetLeadId?: string | undefined;
}) {
  const { units, projects, visibleLeads, createBooking } = useCrm();
  const [unitId, setUnitId] = useState(presetUnitId ?? "");
  const [leadId, setLeadId] = useState(presetLeadId ?? "");
  const [visitDate, setVisitDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUnitId(presetUnitId ?? "");
    setLeadId(presetLeadId ?? "");
    setVisitDate("");
    setError(null);
  }, [open, presetUnitId, presetLeadId]);

  const availableUnits = useMemo(
    () => units.filter((u) => u.status === "available" || u.id === presetUnitId),
    [units, presetUnitId],
  );
  const unit = units.find((u) => u.id === unitId);
  const today = new Date().toISOString().slice(0, 10);

  async function submit() {
    if (!unitId) return setError("Choose a unit to book.");
    if (!leadId) return setError("Choose the lead this booking is for.");
    if (!visitDate) return setError("Pick a visit date.");
    if (visitDate < today) return setError("The visit date cannot be in the past.");
    setSaving(true);
    const result = await createBooking({ unitId, leadId, visitDate });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "This booking could not be created.");
      toast.error(result.error ?? "Booking conflict");
      return;
    }
    toast.success(`Unit ${unit?.code} held`, { description: `Visit set for ${visitDate}.` });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Book a unit</DialogTitle>
          <DialogDescription>
            Holding a unit reserves it instantly and moves the lead to Booked. Two people cannot hold the same unit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Unit
            </Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an available unit" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {availableUnits.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {projects.find((p) => p.id === u.projectId)?.name} · {u.block} · {u.code} · {u.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Lead
            </Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lead" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {visibleLeads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} — {l.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Visit date
            </Label>
            <Input type="date" min={today} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>

          {unit ? (
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-4 text-sm">
              <p className="font-serif text-lg">{money(unit.price)}</p>
              <p className="text-muted-foreground">
                {unit.type} · {unit.areaSqm} m² · Floor {unit.floor} · {unit.view}
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Holding…" : "Confirm booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
