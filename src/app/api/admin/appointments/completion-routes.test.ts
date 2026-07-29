import { beforeEach, describe, expect, it, vi } from "vitest";

const testDoubles = vi.hoisted(() => ({
  auth: vi.fn(),
  canManageAppointmentApi: vi.fn(),
  transitionAppointment: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: testDoubles.auth }));
vi.mock("@/lib/booking/appointment-api-access", () => ({
  canManageAppointmentApi: testDoubles.canManageAppointmentApi,
}));
vi.mock("@/lib/env", () => ({
  getServerEnvironment: () => ({ APP_URL: "https://admin.example.test" }),
}));
vi.mock("@/lib/request-security", () => ({
  getSafeCorrelationId: () => "route-test-correlation-id",
  hasTrustedOrigin: () => true,
}));
vi.mock("@/domain/consent/booking-consent", () => ({
  BookingConsentGateError: class BookingConsentGateError extends Error {
    readonly code = "BOOKING_CONSENT_GATE";
    readonly issues: readonly unknown[] = [];
  },
}));
vi.mock("@/lib/booking/appointment-transition-service", async () => {
  const { z } = await import("zod");

  class AppointmentNotFoundError extends Error {
    readonly code = "APPOINTMENT_NOT_FOUND";
  }
  class AppointmentTransitionConflictError extends Error {
    readonly code = "APPOINTMENT_TRANSITION_CONFLICT";
  }
  class AppointmentDuplicateReviewRequiredError extends Error {
    readonly code = "DUPLICATE_REVIEW_REQUIRED";
  }

  return {
    AppointmentDuplicateReviewRequiredError,
    AppointmentNotFoundError,
    AppointmentTransitionConflictError,
    transitionAppointment: testDoubles.transitionAppointment,
    transitionAppointmentRequestSchema: z
      .object({
        completionPlanId: z.uuid().nullable().optional(),
        note: z.string().nullable().optional(),
        reasonCode: z.string(),
        toStatus: z.string(),
      })
      .strict(),
  };
});

import { POST } from "./[appointmentId]/complete/route";
import { PATCH } from "./[appointmentId]/status/route";

const APPOINTMENT_ID = "11111111-1111-4111-8111-111111111111";
const PLAN_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "33333333-3333-4333-8333-333333333333";

function context() {
  return { params: Promise.resolve({ appointmentId: APPOINTMENT_ID }) };
}

function request(method: "PATCH" | "POST", body: unknown) {
  return new Request(
    `https://admin.example.test/api/admin/appointments/${APPOINTMENT_ID}`,
    {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "https://admin.example.test",
      },
      method,
    },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  testDoubles.auth.mockResolvedValue({
    user: {
      id: USER_ID,
      roles: ["ASSISTANT"],
      status: "ACTIVE",
    },
  });
  testDoubles.canManageAppointmentApi.mockResolvedValue(true);
  testDoubles.transitionAppointment.mockResolvedValue({
    appointmentId: APPOINTMENT_ID,
    consumedPlanId: PLAN_ID,
    fromStatus: "COMPLETED",
    replayed: true,
    toStatus: "COMPLETED",
  });
});

describe("appointment completion route responses", () => {
  it("masks a replayed plan id from assistants in the dedicated complete route", async () => {
    const response = await POST(request("POST", {}), context());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toMatchObject({
      consumedPlanId: null,
      id: APPOINTMENT_ID,
      replayed: true,
      status: "COMPLETED",
    });
    expect(testDoubles.transitionAppointment).toHaveBeenCalledOnce();
  });

  it("masks a replayed plan id from assistants in the normal status route", async () => {
    const response = await PATCH(
      request("PATCH", {
        completionPlanId: null,
        reasonCode: "ADMIN_MARKED_COMPLETED",
        toStatus: "COMPLETED",
      }),
      context(),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toMatchObject({
      appointmentId: APPOINTMENT_ID,
      consumedPlanId: null,
      replayed: true,
      toStatus: "COMPLETED",
    });
    expect(testDoubles.transitionAppointment).toHaveBeenCalledOnce();
  });

  it("rejects a plan id supplied by an assistant before the transition service runs", async () => {
    const response = await POST(
      request("POST", { planId: PLAN_ID }),
      context(),
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.code).toBe("FORBIDDEN");
    expect(testDoubles.transitionAppointment).not.toHaveBeenCalled();
  });
});
