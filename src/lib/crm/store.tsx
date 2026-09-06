import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  bookings as seedBookings,
  leads as seedLeads,
  projects as seedProjects,
  units as seedUnits,
  users,
  DEMO_PASSWORD,
  delay,
} from "./mock-data";
import type {
  ActivityKind,
  Booking,
  Lead,
  LeadActivity,
  LeadStage,
  Project,
  Role,
  Unit,
  User,
} from "./types";
import { LEAD_STAGES } from "./types";

const SESSION_KEY = "aurelia.session";

export type DataStatus = "loading" | "ready" | "error";

export interface NewLeadInput {
  name: string;
  email: string;
  phone: string;
  source: Lead["source"];
  budget: number;
  interestedProjectId?: string;
  notes: string;
  ownerId?: string;
}

export interface BookingInput {
  unitId: string;
  leadId: string;
  visitDate: string;
}

export interface ContactEdit {
  name?: string;
  email?: string;
  phone?: string;
  budget?: number;
  interestedProjectId?: string;
}

function stageLabel(stage: LeadStage) {
  return LEAD_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

interface CrmContextValue {
  user: User | null;
  users: User[];
  hydrated: boolean;
  status: DataStatus;
  retry: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginAs: (userId: string) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  projects: Project[];
  units: Unit[];
  leads: Lead[];
  visibleLeads: Lead[];
  bookings: Booking[];
  visibleBookings: Booking[];
  addLead: (input: NewLeadInput) => Lead;
  updateLeadStage: (leadId: string, stage: LeadStage, options?: { undo?: boolean }) => void;
  addLeadNote: (leadId: string, text: string) => void;
  updateLeadContact: (leadId: string, edit: ContactEdit) => void;
  reassignLead: (leadId: string, ownerId: string) => void;
  createBooking: (input: BookingInput) => { ok: boolean; error?: string; booking?: Booking };
  cancelBooking: (bookingId: string) => void;
  confirmBooking: (bookingId: string) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<DataStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(SESSION_KEY) : null;
    if (raw) {
      const found = users.find((u) => u.id === raw);
      if (found) setUser(found);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    delay(true)
      .then(() => {
        if (!alive) return;
        setLeads(seedLeads.map((l) => ({ ...l, activity: [...l.activity] })));
        setUnits(seedUnits.map((u) => ({ ...u })));
        setBookings(seedBookings.map((b) => ({ ...b })));
        setProjects(seedProjects);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const actor = user?.name ?? "System";

  /** Appends an activity entry (newest first) and optionally patches the lead. */
  const log = useCallback(
    (
      leadId: string,
      entry: { kind: ActivityKind; text: string; fromStage?: LeadStage; toStage?: LeadStage },
      patch?: Partial<Lead>,
    ) => {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== leadId) return l;
          const activity: LeadActivity = {
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            at: new Date().toISOString(),
            by: actor,
            kind: entry.kind,
            text: entry.text,
            ...(entry.fromStage ? { fromStage: entry.fromStage } : {}),
            ...(entry.toStage ? { toStage: entry.toStage } : {}),
          };
          return { ...l, ...patch, activity: [activity, ...l.activity] };
        }),
      );
    },
    [actor],
  );

  const login = useCallback(async (email: string, password: string) => {
    await delay(true, 500);
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return { ok: false, error: "No account found for that email." };
    if (password !== DEMO_PASSWORD) return { ok: false, error: "Incorrect password." };
    setUser(found);
    window.localStorage.setItem(SESSION_KEY, found.id);
    return { ok: true };
  }, []);

  const loginAs = useCallback((userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (!found) return;
    setUser(found);
    window.localStorage.setItem(SESSION_KEY, found.id);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const switchRole = useCallback((role: Role) => {
    const found = users.find((u) => u.role === role);
    if (!found) return;
    setUser(found);
    window.localStorage.setItem(SESSION_KEY, found.id);
  }, []);

  const visibleLeads = useMemo(() => {
    if (!user) return [];
    return user.role === "admin" ? leads : leads.filter((l) => l.ownerId === user.id);
  }, [leads, user]);

  const visibleBookings = useMemo(() => {
    if (!user) return [];
    return user.role === "admin" ? bookings : bookings.filter((b) => b.agentId === user.id);
  }, [bookings, user]);

  const addLead = useCallback(
    (input: NewLeadInput) => {
      const owner = input.ownerId ?? user?.id ?? "u-2";
      const lead: Lead = {
        id: `l-${Date.now()}`,
        name: input.name,
        email: input.email,
        phone: input.phone,
        source: input.source,
        stage: "new",
        budget: input.budget,
        interestedProjectId: input.interestedProjectId,
        ownerId: owner,
        createdAt: new Date().toISOString(),
        notes: input.notes,
        activity: [
          {
            id: `a-${Date.now()}`,
            at: new Date().toISOString(),
            kind: "created",
            text: `Lead created from ${input.source} and assigned to ${
              users.find((u) => u.id === owner)?.name ?? "the team"
            }.`,
            by: actor,
            toStage: "new",
          },
        ],
      };
      setLeads((prev) => [lead, ...prev]);
      return lead;
    },
    [actor, user],
  );

  const updateLeadStage = useCallback(
    (leadId: string, stage: LeadStage, options?: { undo?: boolean }) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.stage === stage) return;
      const from = lead.stage;
      log(
        leadId,
        {
          kind: options?.undo ? "undo" : "stage",
          text: options?.undo
            ? `Move undone — restored from ${stageLabel(from)} to ${stageLabel(stage)}.`
            : `Stage moved from ${stageLabel(from)} to ${stageLabel(stage)}.`,
          fromStage: from,
          toStage: stage,
        },
        { stage },
      );
    },
    [leads, log],
  );

  const addLeadNote = useCallback(
    (leadId: string, text: string) => {
      log(leadId, { kind: "note", text });
    },
    [log],
  );

  const updateLeadContact = useCallback(
    (leadId: string, edit: ContactEdit) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;
      const changes: string[] = [];
      if (edit.name && edit.name !== lead.name) changes.push(`name to ${edit.name}`);
      if (edit.email && edit.email !== lead.email) changes.push(`email to ${edit.email}`);
      if (edit.phone && edit.phone !== lead.phone) changes.push(`phone to ${edit.phone}`);
      if (edit.budget && edit.budget !== lead.budget)
        changes.push(`budget to $${edit.budget.toLocaleString()}`);
      if (edit.interestedProjectId && edit.interestedProjectId !== lead.interestedProjectId) {
        const name = projects.find((p) => p.id === edit.interestedProjectId)?.name;
        changes.push(`interested project to ${name ?? edit.interestedProjectId}`);
      }
      if (changes.length === 0) return;
      log(
        leadId,
        { kind: "edit", text: `Updated ${changes.join(", ")}.` },
        {
          ...(edit.name ? { name: edit.name } : {}),
          ...(edit.email ? { email: edit.email } : {}),
          ...(edit.phone ? { phone: edit.phone } : {}),
          ...(edit.budget ? { budget: edit.budget } : {}),
          ...(edit.interestedProjectId
            ? { interestedProjectId: edit.interestedProjectId }
            : {}),
        },
      );
    },
    [leads, log, projects],
  );

  const reassignLead = useCallback(
    (leadId: string, ownerId: string) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.ownerId === ownerId) return;
      const fromName = users.find((u) => u.id === lead.ownerId)?.name ?? "Unassigned";
      const toName = users.find((u) => u.id === ownerId)?.name ?? "Unassigned";
      log(
        leadId,
        { kind: "assign", text: `Reassigned from ${fromName} to ${toName}.` },
        { ownerId },
      );
    },
    [leads, log],
  );

  const createBooking = useCallback(
    ({ unitId, leadId, visitDate }: BookingInput) => {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return { ok: false, error: "That unit no longer exists." };
      if (unit.status === "sold") return { ok: false, error: `${unit.code} is already sold.` };
      const clash = bookings.find((b) => b.unitId === unitId && b.status !== "cancelled");
      if (clash || unit.status === "reserved") {
        return { ok: false, error: `${unit.code} is already held by another booking.` };
      }
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return { ok: false, error: "Pick a lead for this booking." };
      const booking: Booking = {
        id: `b-${Date.now()}`,
        unitId,
        leadId,
        agentId: user?.id ?? "u-2",
        createdAt: new Date().toISOString(),
        visitDate,
        amount: unit.price,
        status: "held",
      };
      setBookings((prev) => [booking, ...prev]);
      setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, status: "reserved" } : u)));
      log(
        leadId,
        {
          kind: "booking",
          text: `Held unit ${unit.code} with a visit on ${visitDate}. Stage moved from ${stageLabel(
            lead.stage,
          )} to ${stageLabel("won")}.`,
          fromStage: lead.stage,
          toStage: "won",
        },
        { stage: "won" },
      );
      return { ok: true, booking };
    },
    [bookings, leads, log, units, user],
  );

  const cancelBooking = useCallback(
    (bookingId: string) => {
      const target = bookings.find((b) => b.id === bookingId);
      if (!target) return;
      const unit = units.find((u) => u.id === target.unitId);
      setUnits((us) => us.map((u) => (u.id === target.unitId ? { ...u, status: "available" } : u)));
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)));
      log(target.leadId, {
        kind: "booking",
        text: `Booking for unit ${unit?.code ?? target.unitId} was cancelled and the unit released.`,
      });
    },
    [bookings, log, units],
  );

  const confirmBooking = useCallback(
    (bookingId: string) => {
      const target = bookings.find((b) => b.id === bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b)),
      );
      if (target) {
        const unit = units.find((u) => u.id === target.unitId);
        log(target.leadId, {
          kind: "booking",
          text: `Booking for unit ${unit?.code ?? target.unitId} confirmed.`,
        });
      }
    },
    [bookings, log, units],
  );

  const value: CrmContextValue = {
    user,
    users,
    hydrated,
    status,
    retry,
    login,
    loginAs,
    logout,
    switchRole,
    projects,
    units,
    leads,
    visibleLeads,
    bookings,
    visibleBookings,
    addLead,
    updateLeadStage,
    addLeadNote,
    updateLeadContact,
    reassignLead,
    createBooking,
    cancelBooking,
    confirmBooking,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}
