import heroResidence from "@/assets/hero-residence.jpg";
import projectVillas from "@/assets/project-villas.jpg";
import projectMarina from "@/assets/project-marina.jpg";
import projectTownhouses from "@/assets/project-townhouses.jpg";
import interiorLiving from "@/assets/interior-living.jpg";

import type { Booking, Lead, Project, Unit, User } from "./types";

/**
 * Mock data layer. Every export here is shaped like an API response so the
 * whole layer can be swapped for real network calls without touching the UI.
 */

export const images = {
  hero: heroResidence,
  villas: projectVillas,
  marina: projectMarina,
  townhouses: projectTownhouses,
  interior: interiorLiving,
};

export const users: User[] = [
  {
    id: "u-1",
    name: "Layla Haddad",
    email: "admin@aurelia.com",
    role: "admin",
    title: "Sales Director",
    initials: "LH",
  },
  {
    id: "u-2",
    name: "Omar Nassar",
    email: "omar@aurelia.com",
    role: "sales",
    title: "Senior Sales Consultant",
    initials: "ON",
  },
  {
    id: "u-3",
    name: "Rania Fahmy",
    email: "rania@aurelia.com",
    role: "sales",
    title: "Sales Consultant",
    initials: "RF",
  },
];

export const DEMO_PASSWORD = "aurelia";

export const projects: Project[] = [
  {
    id: "p-1",
    name: "Palazzo Aurelia",
    city: "Amman",
    district: "Abdoun Heights",
    handover: "Q4 2027",
    priceFrom: 385000,
    description:
      "A 24-storey landmark residence wrapped in warm sandstone and curved terraces, with a private arrival court, spa level and sky lounge on the crown floor.",
    amenities: ["Sky lounge", "Spa & hammam", "Valet arrival", "Concierge", "Infinity pool"],
    cover: heroResidence,
    gallery: [heroResidence, interiorLiving, projectMarina],
    blocks: ["Tower A", "Tower B"],
  },
  {
    id: "p-2",
    name: "Olivetta Villas",
    city: "Amman",
    district: "Dabouq",
    handover: "Q2 2027",
    priceFrom: 720000,
    description:
      "Twenty-eight courtyard villas arranged around shaded olive walks, each with a private pool, roof terrace and staff quarters.",
    amenities: ["Private pools", "Olive walk", "Clubhouse", "Padel court", "Gated security"],
    cover: projectVillas,
    gallery: [projectVillas, interiorLiving, projectTownhouses],
    blocks: ["Garden Row", "Olive Row"],
  },
  {
    id: "p-3",
    name: "Marina Verde",
    city: "Aqaba",
    district: "South Marina",
    handover: "Q1 2028",
    priceFrom: 265000,
    description:
      "Waterfront apartments over a sandstone podium, with berth access, a sunset deck and full-height glazing facing the marina.",
    amenities: ["Private berths", "Sunset deck", "Beach club", "Gym", "Kids pool"],
    cover: projectMarina,
    gallery: [projectMarina, interiorLiving, heroResidence],
    blocks: ["Quay East", "Quay West"],
  },
  {
    id: "p-4",
    name: "Terra Rossa Townhomes",
    city: "Amman",
    district: "Airport Road",
    handover: "Q3 2026",
    priceFrom: 198000,
    description:
      "Forty-two family townhomes on tree-lined lanes, with terracotta detailing, private gardens and a shared central green.",
    amenities: ["Central green", "Cycle lanes", "Nursery", "Community hall"],
    cover: projectTownhouses,
    gallery: [projectTownhouses, interiorLiving, projectVillas],
    blocks: ["Lane 1", "Lane 2", "Lane 3"],
  },
];

const unitTypes = [
  { type: "1 Bedroom", bedrooms: 1, area: 78 },
  { type: "2 Bedroom", bedrooms: 2, area: 118 },
  { type: "3 Bedroom", bedrooms: 3, area: 164 },
  { type: "Penthouse", bedrooms: 4, area: 240 },
];

const views = ["City view", "Garden view", "Marina view", "Courtyard view"];

function buildUnits(): Unit[] {
  const out: Unit[] = [];
  projects.forEach((project, pIndex) => {
    project.blocks.forEach((block, bIndex) => {
      for (let i = 0; i < 9; i++) {
        const t = unitTypes[(i + bIndex) % unitTypes.length]!;
        const floor = 1 + ((i + pIndex) % 6);
        const seed = pIndex * 31 + bIndex * 17 + i * 7;
        const status =
          seed % 9 === 0 ? "sold" : seed % 5 === 0 ? "reserved" : ("available" as Unit["status"]);
        out.push({
          id: `u-${project.id}-${bIndex}-${i}`,
          projectId: project.id,
          code: `${block.split(" ")[0]!.slice(0, 2).toUpperCase()}-${floor}0${i + 1}`,
          type: t.type,
          bedrooms: t.bedrooms,
          areaSqm: t.area + (seed % 12),
          floor,
          price: Math.round((project.priceFrom + t.area * 1850 + (seed % 7) * 6400) / 500) * 500,
          status,
          block,
          view: views[seed % views.length]!,
        });
      }
    });
  });
  return out;
}

export const units: Unit[] = buildUnits();

function daysAgo(n: number) {
  return new Date(Date.UTC(2026, 8, 6) - n * 86_400_000).toISOString();
}

const leadSeed: Array<
  Pick<Lead, "name" | "email" | "phone" | "source" | "stage" | "budget" | "ownerId"> & {
    project: string;
    age: number;
    notes: string;
  }
> = [
  { name: "Sami Barakat", email: "sami.barakat@mail.com", phone: "+962 79 114 2288", source: "Website", stage: "new", budget: 420000, ownerId: "u-2", project: "p-1", age: 1, notes: "Downsizing from a villa, wants a high floor with a terrace." },
  { name: "Nadia Kanaan", email: "nadia.k@mail.com", phone: "+962 77 552 9910", source: "Referral", stage: "contacted", budget: 780000, ownerId: "u-2", project: "p-2", age: 3, notes: "Referred by an Olivetta owner. Needs staff quarters." },
  { name: "Fadi Rimawi", email: "fadi.rimawi@mail.com", phone: "+962 78 330 4471", source: "Campaign", stage: "viewing", budget: 300000, ownerId: "u-3", project: "p-3", age: 5, notes: "Investor, comparing marina yields against Amman." },
  { name: "Hala Mansour", email: "hala.mansour@mail.com", phone: "+962 79 887 1123", source: "Walk-in", stage: "negotiation", budget: 265000, ownerId: "u-3", project: "p-4", age: 8, notes: "Family of four, needs handover before the school year." },
  { name: "Ziad Toukan", email: "ziad.toukan@mail.com", phone: "+962 79 442 7788", source: "Broker", stage: "won", budget: 512000, ownerId: "u-2", project: "p-1", age: 12, notes: "Signed reservation on a Tower A three-bedroom." },
  { name: "Dina Suleiman", email: "dina.s@mail.com", phone: "+962 77 909 3341", source: "Website", stage: "lost", budget: 190000, ownerId: "u-3", project: "p-4", age: 16, notes: "Chose a competitor closer to her workplace." },
  { name: "Karim Adwan", email: "karim.adwan@mail.com", phone: "+962 78 665 2201", source: "Website", stage: "new", budget: 640000, ownerId: "u-3", project: "p-2", age: 2, notes: "Asked for the villa masterplan and payment plan." },
  { name: "Yara Halabi", email: "yara.halabi@mail.com", phone: "+962 79 220 8845", source: "Referral", stage: "contacted", budget: 355000, ownerId: "u-2", project: "p-3", age: 4, notes: "Wants a two-bedroom with a berth option." },
  { name: "Rami Odeh", email: "rami.odeh@mail.com", phone: "+962 77 431 6600", source: "Campaign", stage: "viewing", budget: 470000, ownerId: "u-2", project: "p-1", age: 6, notes: "Second viewing booked with his wife." },
  { name: "Lina Sabbagh", email: "lina.sabbagh@mail.com", phone: "+962 79 771 5590", source: "Walk-in", stage: "negotiation", budget: 845000, ownerId: "u-3", project: "p-2", age: 9, notes: "Negotiating a corner villa with a larger garden." },
  { name: "Tarek Zubi", email: "tarek.zubi@mail.com", phone: "+962 78 118 3399", source: "Broker", stage: "contacted", budget: 232000, ownerId: "u-3", project: "p-4", age: 7, notes: "Budget-sensitive, interested in Lane 3." },
  { name: "Maha Rifai", email: "maha.rifai@mail.com", phone: "+962 79 664 2277", source: "Website", stage: "won", budget: 398000, ownerId: "u-3", project: "p-3", age: 14, notes: "Reserved a Quay East apartment." },
];

export const leads: Lead[] = leadSeed.map((seed, i) => ({
  id: `l-${i + 1}`,
  name: seed.name,
  email: seed.email,
  phone: seed.phone,
  source: seed.source,
  stage: seed.stage,
  budget: seed.budget,
  interestedProjectId: seed.project,
  ownerId: seed.ownerId,
  createdAt: daysAgo(seed.age),
  notes: seed.notes,
  activity: [
    {
      id: `a-${i + 1}-1`,
      at: daysAgo(seed.age),
      kind: "note",
      text: `Lead captured from ${seed.source}.`,
      by: users.find((u) => u.id === seed.ownerId)?.name ?? "System",
    },
  ],
}));

export const bookings: Booking[] = [
  {
    id: "b-1",
    unitId: units.find((u) => u.status === "reserved")?.id ?? units[0]!.id,
    leadId: "l-5",
    agentId: "u-2",
    createdAt: daysAgo(11),
    visitDate: daysAgo(-3),
    amount: 512000,
    status: "confirmed",
  },
  {
    id: "b-2",
    unitId: units.filter((u) => u.status === "reserved")[1]?.id ?? units[1]!.id,
    leadId: "l-12",
    agentId: "u-3",
    createdAt: daysAgo(13),
    visitDate: daysAgo(-6),
    amount: 398000,
    status: "held",
  },
];

/** Simulated latency so loading states are real. */
export function delay<T>(value: T, ms = 550): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
