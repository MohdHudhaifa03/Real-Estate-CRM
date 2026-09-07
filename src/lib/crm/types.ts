export type Role = "admin" | "sales";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  initials: string;
}

export type LeadStage =
  | "new"
  | "contacted"
  | "site_visit"
  | "interested"
  | "negotiation"
  | "booked"
  | "lost";

export const LEAD_STAGES: { id: LeadStage; label: string; hint: string }[] = [
  { id: "new", label: "New", hint: "Fresh enquiries awaiting first contact" },
  { id: "contacted", label: "Contacted", hint: "Qualified by phone or email" },
  { id: "site_visit", label: "Site Visit", hint: "Site visit scheduled or completed" },
  { id: "interested", label: "Interested", hint: "Actively considering a unit or project" },
  { id: "negotiation", label: "Negotiation", hint: "Price and terms in discussion" },
  { id: "booked", label: "Booked", hint: "Unit reserved against this lead" },
  { id: "lost", label: "Lost", hint: "Not proceeding for now" },
];

export function isClosedStage(stage: LeadStage) {
  return stage === "booked" || stage === "lost";
}

export type LeadSource = "Website" | "Referral" | "Walk-in" | "Campaign" | "Broker";

export type ActivityKind =
  | "note"
  | "stage"
  | "undo"
  | "call"
  | "booking"
  | "assign"
  | "edit"
  | "created";

export interface LeadActivity {
  id: string;
  at: string;
  kind: ActivityKind;
  text: string;
  by: string;
  fromStage?: LeadStage | undefined;
  toStage?: LeadStage | undefined;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  budget: number;
  interestedProjectId?: string | undefined;
  ownerId: string;
  createdAt: string;
  notes: string;
  followUpDate?: string;
  activity: LeadActivity[];
}

export type UnitStatus = "available" | "reserved" | "sold";

export interface Unit {
  id: string;
  projectId: string;
  code: string;
  type: string;
  bedrooms: number;
  areaSqm: number;
  floor: number;
  price: number;
  status: UnitStatus;
  block: string;
  view: string;
  buildingId?: string;
}

export interface Building {
  id: string;
  name: string;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  city: string;
  district: string;
  handover: string;
  priceFrom: number;
  description: string;
  amenities: string[];
  cover: string;
  gallery: string[];
  blocks: string[];
  buildings: Building[];
}

export interface Booking {
  id: string;
  unitId: string;
  leadId: string;
  agentId: string;
  createdAt: string;
  visitDate: string;
  amount: number;
  status: "held" | "confirmed" | "cancelled";
}

export interface NewLeadInput {
  name: string;
  email: string;
  phone: string;
  source: Lead["source"];
  budget: number;
  interestedProjectId?: string;
  notes: string;
  ownerId?: string;
  followUpDate?: string;
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
  followUpDate?: string | null;
}
