import type { BookingInput, ContactEdit, Lead, LeadStage, NewLeadInput, User } from "@/lib/crm/types";

import { api, type ApiSuccess } from "./client";
import {
  mapAuthPayload,
  mapBooking,
  mapLead,
  mapProject,
  mapUnit,
  mapUser,
  type AuthPayload,
} from "./mappers";

function asRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>("/auth/login", {
    email,
    password,
  });
  return mapAuthPayload(asRecord(data.data));
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>("/auth/me");
  return mapUser(asRecord(data.data));
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<ApiSuccess<unknown>>("/users");
  return asRecords(data.data).map(mapUser);
}

export async function getProjects() {
  const { data } = await api.get<ApiSuccess<unknown>>("/projects");
  return asRecords(data.data).map(mapProject);
}

export async function getUnits() {
  const { data } = await api.get<ApiSuccess<unknown>>("/units");
  return asRecords(data.data).map(mapUnit);
}

export async function getLeads() {
  const { data } = await api.get<ApiSuccess<unknown>>("/leads");
  return asRecords(data.data).map(mapLead);
}

export async function createLead(input: NewLeadInput): Promise<Lead> {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>("/leads", input);
  return mapLead(asRecord(data.data));
}

export async function updateLeadContact(leadId: string, edit: ContactEdit): Promise<Lead> {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(`/leads/${leadId}`, edit);
  return mapLead(asRecord(data.data));
}

export async function updateLeadStage(
  leadId: string,
  stage: LeadStage,
  isUndo?: boolean,
): Promise<Lead> {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(`/leads/${leadId}/stage`, {
    stage,
    isUndo: Boolean(isUndo),
  });
  return mapLead(asRecord(data.data));
}

export async function reassignLead(leadId: string, ownerId: string): Promise<Lead> {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(`/leads/${leadId}/assign`, {
    ownerId,
  });
  return mapLead(asRecord(data.data));
}

export async function addLeadNote(leadId: string, text: string) {
  await api.post(`/leads/${leadId}/notes`, { text });
}

export async function getBookings() {
  const { data } = await api.get<ApiSuccess<unknown>>("/bookings");
  return asRecords(data.data).map(mapBooking);
}

export async function createBooking(input: BookingInput) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>("/bookings", input);
  return mapBooking(asRecord(data.data));
}

export async function confirmBooking(bookingId: string) {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(
    `/bookings/${bookingId}/confirm`,
  );
  return mapBooking(asRecord(data.data));
}

export async function cancelBooking(bookingId: string) {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(
    `/bookings/${bookingId}/cancel`,
  );
  return mapBooking(asRecord(data.data));
}
