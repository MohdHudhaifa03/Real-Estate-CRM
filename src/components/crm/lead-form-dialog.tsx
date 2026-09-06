import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { useCrm } from "@/lib/crm/store";
import type { LeadSource } from "@/lib/crm/types";

const SOURCES: LeadSource[] = ["Website", "Referral", "Walk-in", "Campaign", "Broker"];

const schema = z.object({
  name: z.string().trim().min(2, "Enter the full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a reachable phone number."),
  budget: z
    .number({ invalid_type_error: "Enter a budget." })
    .min(10000, "Budget must be at least $10,000."),
  source: z.enum(["Website", "Referral", "Walk-in", "Campaign", "Broker"]),
  interestedProjectId: z.string().optional(),
  notes: z.string().max(400, "Keep notes under 400 characters.").optional(),
  ownerId: z.string().optional(),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export function LeadFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { projects, addLead, user, users } = useCrm();
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    budget: "",
    source: "Website" as LeadSource,
    interestedProjectId: "",
    notes: "",
    ownerId: user?.id ?? "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit() {
    const parsed = schema.safeParse({
      ...form,
      budget: form.budget === "" ? Number.NaN : Number(form.budget),
      interestedProjectId: form.interestedProjectId || undefined,
      ownerId: form.ownerId || undefined,
    });
    if (!parsed.success) {
      const next: Errors = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof Errors;
        if (!next[key]) next[key] = issue.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    const lead = addLead({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      source: parsed.data.source,
      budget: parsed.data.budget,
      notes: parsed.data.notes ?? "",
      ...(parsed.data.interestedProjectId
        ? { interestedProjectId: parsed.data.interestedProjectId }
        : {}),
      ...(parsed.data.ownerId ? { ownerId: parsed.data.ownerId } : {}),
    });
    setSaving(false);
    toast.success(`${lead.name} added to the New stage`);
    setForm({
      name: "",
      email: "",
      phone: "",
      budget: "",
      source: "Website",
      interestedProjectId: "",
      notes: "",
      ownerId: user?.id ?? "",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Add a lead</DialogTitle>
          <DialogDescription>
            New leads land in the New stage and are assigned to you unless changed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.name} className="sm:col-span-2">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Sami Barakat"
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@mail.com"
            />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+962 79 000 0000"
            />
          </Field>
          <Field label="Budget (USD)" error={errors.budget}>
            <Input
              inputMode="numeric"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="450000"
            />
          </Field>
          <Field label="Source" error={errors.source}>
            <Select value={form.source} onValueChange={(v) => set("source", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Interested project" className="sm:col-span-2">
            <Select
              value={form.interestedProjectId}
              onValueChange={(v) => set("interestedProjectId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {user?.role === "admin" ? (
            <Field label="Assign to" className="sm:col-span-2">
              <Select value={form.ownerId} onValueChange={(v) => set("ownerId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <Field label="Notes" error={errors.notes} className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="What are they looking for?"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Add lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
