import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";


export const UPCOMING_APPOINTMENT_STATUSES = [
  "REQUESTED",
  "PENDING_REVIEW",
  "CONFIRMED",
  "RESCHEDULE_PROPOSED",
] as const;

export const PROFILE_PREFIX = "client-profile:";
export const DOCUMENT_PREFIX = "client-document:";

const nullableText = (maximum: number) =>
  z.string().trim().max(maximum).nullable().optional();

export const updateClientSchema = z
  .object({
    address: nullableText(500),
    birthYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
    city: nullableText(120),
    contactConsent: z.boolean().optional(),
    country: nullableText(120),
    district: nullableText(120),
    email: z.string().trim().email().max(320).nullable().optional(),
    emergencyContact: nullableText(240),
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    parentPrimaryEmail: z.string().trim().email().max(320).nullable().optional(),
    parentPrimaryName: nullableText(240),
    parentPrimaryPhone: nullableText(40),
    parentPrimaryRelation: nullableText(80),
    phone: nullableText(40),
    preferredContactMethod: nullableText(40),
    preferredName: nullableText(120),
    status: z.enum(["PROSPECTIVE", "ACTIVE", "INACTIVE"]).optional(),
    whatsapp: nullableText(40),
  })
  .strict();

export type RouteContext = { params: Promise<{ clientId: string }> };

export type JsonRecord = Record<string, unknown>;

export function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

export function notFound() {
  return NextResponse.json(
    { code: "CLIENT_NOT_FOUND", error: "Danışan kaydı bulunamadı." },
    { status: 404 },
  );
}

export function asJsonRecord(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

export function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function splitFullName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "Veli";
  return { firstName, lastName: parts.join(" ") || "-" };
}

export async function requireClientAccess(permission: "clients:read" | "clients:manage") {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, permission)
  ) {
    return null;
  }
  return session;
}

export const clientAppointmentSelect = {
  durationMinutesSnapshot: true,
  endsAt: true,
  financeEntries: {
    select: { amountMinor: true, type: true },
  },
  id: true,
  locationTypeSnapshot: true,
  practitioner: { select: { displayName: true } },
  publicReference: true,
  requestNote: true,
  serviceNameSnapshot: true,
  startsAt: true,
  status: true,
} as const;

export function serializeAppointment<T extends {
  financeEntries: Array<{ amountMinor: bigint; type: string }>;
}>(appointment: T) {
  const paymentBalance = appointment.financeEntries.reduce(
    (total, entry) => total + entry.amountMinor,
    0n,
  );
  const { financeEntries: _financeEntries, ...rest } = appointment;
  return {
    ...rest,
    paymentStatus: paymentBalance < 0n ? "PAID" : "PENDING",
  };
}

