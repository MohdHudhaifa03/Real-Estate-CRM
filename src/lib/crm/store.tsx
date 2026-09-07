"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import * as crmApi from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/api/error";
import { clearToken, getToken, SESSION_CLEARED_EVENT, setToken } from "@/lib/api/session";
import type {
  Booking,
  BookingInput,
  ContactEdit,
  Lead,
  LeadStage,
  NewLeadInput,
  Project,
  Unit,
  User,
} from "./types";

export type { BookingInput, ContactEdit, NewLeadInput };

export type DataStatus = "loading" | "ready" | "error";

interface CrmContextValue {
  user: User | null;
  users: User[];
  hydrated: boolean;
  status: DataStatus;
  retry: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  projects: Project[];
  units: Unit[];
  leads: Lead[];
  visibleLeads: Lead[];
  bookings: Booking[];
  visibleBookings: Booking[];
  addLead: (input: NewLeadInput) => Promise<Lead>;
  updateLeadStage: (leadId: string, stage: LeadStage, options?: { undo?: boolean }) => Promise<void>;
  addLeadNote: (leadId: string, text: string) => Promise<void>;
  updateLeadContact: (leadId: string, edit: ContactEdit) => Promise<void>;
  reassignLead: (leadId: string, ownerId: string) => Promise<void>;
  createBooking: (input: BookingInput) => Promise<{ ok: boolean; error?: string; booking?: Booking }>;
  cancelBooking: (bookingId: string) => Promise<void>;
  confirmBooking: (bookingId: string) => Promise<void>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<DataStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadWorkspace = useCallback(async () => {
    const [nextUsers, nextProjects, nextUnits, nextLeads, nextBookings] = await Promise.all([
      crmApi.getUsers(),
      crmApi.getProjects(),
      crmApi.getUnits(),
      crmApi.getLeads(),
      crmApi.getBookings(),
    ]);
    setUsers(nextUsers);
    setProjects(nextProjects);
    setUnits(nextUnits);
    setLeads(nextLeads);
    setBookings(nextBookings);
  }, []);

  useEffect(() => {
    const onCleared = () => {
      setUser(null);
      setUsers([]);
      setLeads([]);
      setUnits([]);
      setBookings([]);
      setProjects([]);
    };
    window.addEventListener(SESSION_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, onCleared);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) {
        if (alive) {
          setHydrated(true);
          setStatus("ready");
        }
        return;
      }
      try {
        const me = await crmApi.getMe();
        if (alive) setUser(me);
      } catch {
        clearToken();
        if (alive) setUser(null);
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      setStatus("ready");
      return;
    }
    let alive = true;
    setStatus("loading");
    loadWorkspace()
      .then(() => {
        if (alive) setStatus("ready");
      })
      .catch(() => {
        if (alive) setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [attempt, hydrated, loadWorkspace, user]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await crmApi.login(email.trim(), password);
      setToken(result.token);
      setUser(result.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await crmApi.logout();
    } catch {
      // Token clear is the real logout.
    }
    clearToken();
    setUser(null);
    setUsers([]);
    setLeads([]);
    setUnits([]);
    setBookings([]);
    setProjects([]);
  }, []);

  const visibleLeads = useMemo(() => {
    if (!user) return [];
    return user.role === "admin" ? leads : leads.filter((l) => l.ownerId === user.id);
  }, [leads, user]);

  const visibleBookings = useMemo(() => {
    if (!user) return [];
    return user.role === "admin" ? bookings : bookings.filter((b) => b.agentId === user.id);
  }, [bookings, user]);

  const addLead = useCallback(async (input: NewLeadInput) => {
    const lead = await crmApi.createLead(input);
    const nextLeads = await crmApi.getLeads();
    setLeads(nextLeads);
    return nextLeads.find((item) => item.id === lead.id) ?? lead;
  }, []);

  const updateLeadStage = useCallback(async (leadId: string, stage: LeadStage, options?: { undo?: boolean }) => {
    await crmApi.updateLeadStage(leadId, stage, options?.undo);
    setLeads(await crmApi.getLeads());
  }, []);

  const addLeadNote = useCallback(async (leadId: string, text: string) => {
    await crmApi.addLeadNote(leadId, text);
    setLeads(await crmApi.getLeads());
  }, []);

  const updateLeadContact = useCallback(async (leadId: string, edit: ContactEdit) => {
    await crmApi.updateLeadContact(leadId, edit);
    setLeads(await crmApi.getLeads());
  }, []);

  const reassignLead = useCallback(async (leadId: string, ownerId: string) => {
    await crmApi.reassignLead(leadId, ownerId);
    setLeads(await crmApi.getLeads());
  }, []);

  const createBooking = useCallback(async ({ unitId, leadId, visitDate }: BookingInput) => {
    try {
      const booking = await crmApi.createBooking({ unitId, leadId, visitDate });
      const [nextLeads, nextUnits, nextBookings] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getUnits(),
        crmApi.getBookings(),
      ]);
      setLeads(nextLeads);
      setUnits(nextUnits);
      setBookings(nextBookings);
      return { ok: true, booking };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId: string) => {
    await crmApi.cancelBooking(bookingId);
    const [nextLeads, nextUnits, nextBookings] = await Promise.all([
      crmApi.getLeads(),
      crmApi.getUnits(),
      crmApi.getBookings(),
    ]);
    setLeads(nextLeads);
    setUnits(nextUnits);
    setBookings(nextBookings);
  }, []);

  const confirmBooking = useCallback(async (bookingId: string) => {
    await crmApi.confirmBooking(bookingId);
    const [nextLeads, nextUnits, nextBookings] = await Promise.all([
      crmApi.getLeads(),
      crmApi.getUnits(),
      crmApi.getBookings(),
    ]);
    setLeads(nextLeads);
    setUnits(nextUnits);
    setBookings(nextBookings);
  }, []);

  const value: CrmContextValue = {
    user,
    users,
    hydrated,
    status,
    retry,
    login,
    logout,
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
