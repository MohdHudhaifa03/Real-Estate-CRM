import type {
  Booking,
  Lead,
  LeadActivity,
  LeadSource,
  LeadStage,
  Project,
  Unit,
  UnitStatus,
  User,
} from "@/lib/crm/types";

function toIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    role: raw.role === "admin" ? "admin" : "sales",
    title: String(raw.title ?? ""),
    initials: String(raw.initials ?? "").slice(0, 2) || "??",
  };
}

function mapActivity(raw: Record<string, unknown>): LeadActivity {
  return {
    id: String(raw.id ?? ""),
    at: toIso(raw.at),
    kind: (raw.kind as LeadActivity["kind"]) ?? "note",
    text: String(raw.text ?? ""),
    by: String(raw.by ?? "System"),
    ...(raw.fromStage ? { fromStage: raw.fromStage as LeadStage } : {}),
    ...(raw.toStage ? { toStage: raw.toStage as LeadStage } : {}),
  };
}

export function mapLead(raw: Record<string, unknown>): Lead {
  const activity = Array.isArray(raw.activity) ? raw.activity : [];
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    source: (raw.source as LeadSource) ?? "Website",
    stage: (raw.stage as LeadStage) ?? "new",
    budget: toNumber(raw.budget),
    ownerId: String(raw.ownerId ?? ""),
    createdAt: toIso(raw.createdAt),
    notes: String(raw.notes ?? ""),
    activity: activity
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map(mapActivity)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at)),
    ...(raw.interestedProjectId
      ? { interestedProjectId: String(raw.interestedProjectId) }
      : {}),
  };
}

export function mapProject(raw: Record<string, unknown>): Project {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    city: String(raw.city ?? ""),
    district: String(raw.district ?? ""),
    handover: String(raw.handover ?? ""),
    priceFrom: toNumber(raw.priceFrom),
    description: String(raw.description ?? ""),
    amenities: Array.isArray(raw.amenities) ? raw.amenities.map(String) : [],
    cover: String(raw.cover ?? ""),
    gallery: Array.isArray(raw.gallery) ? raw.gallery.map(String) : [],
    blocks: Array.isArray(raw.blocks) ? raw.blocks.map(String) : [],
  };
}

export function mapUnit(raw: Record<string, unknown>): Unit {
  return {
    id: String(raw.id ?? ""),
    projectId: String(raw.projectId ?? ""),
    code: String(raw.code ?? ""),
    type: String(raw.type ?? ""),
    bedrooms: toNumber(raw.bedrooms),
    areaSqm: toNumber(raw.areaSqm),
    floor: toNumber(raw.floor),
    price: toNumber(raw.price),
    status: (raw.status as UnitStatus) ?? "available",
    block: String(raw.block ?? ""),
    view: String(raw.view ?? ""),
  };
}

export function mapBooking(raw: Record<string, unknown>): Booking {
  return {
    id: String(raw.id ?? ""),
    unitId: String(raw.unitId ?? ""),
    leadId: String(raw.leadId ?? ""),
    agentId: String(raw.agentId ?? ""),
    createdAt: toIso(raw.createdAt),
    visitDate: typeof raw.visitDate === "string" ? raw.visitDate : toIso(raw.visitDate).slice(0, 10),
    amount: toNumber(raw.amount),
    status: (raw.status as Booking["status"]) ?? "held",
  };
}

export type AuthPayload = { token: string; user: User };

export function mapAuthPayload(raw: Record<string, unknown>): AuthPayload {
  const userRaw =
    raw.user && typeof raw.user === "object" ? (raw.user as Record<string, unknown>) : raw;
  return {
    token: String(raw.token ?? ""),
    user: mapUser(userRaw),
  };
}
