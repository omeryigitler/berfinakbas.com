import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDatabaseMock } = vi.hoisted(() => ({ getDatabaseMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getDatabase: getDatabaseMock }));

import { canManageAppointmentApi } from "./appointment-api-access";

const appointmentId = "22222222-2222-4222-8222-222222222222";
const userId = "11111111-1111-4111-8111-111111111111";

function createDatabase(result: { id: string } | null) {
  return {
    appointment: { findFirst: vi.fn().mockResolvedValue(result) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("canManageAppointmentApi", () => {
  it("rejects roles without appointment management permission without querying data", async () => {
    await expect(
      canManageAppointmentApi({ appointmentId, roles: ["FINANCE"], userId }),
    ).resolves.toBe(false);
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  it.each([["SUPER_ADMIN"], ["ASSISTANT"]] as const)(
    "allows the current full-scope %s role without a practitioner lookup",
    async (role) => {
      await expect(canManageAppointmentApi({ appointmentId, roles: [role], userId })).resolves.toBe(
        true,
      );
      expect(getDatabaseMock).not.toHaveBeenCalled();
    },
  );

  it("allows a therapist only for an appointment owned by their practitioner record", async () => {
    const database = createDatabase({ id: appointmentId });
    getDatabaseMock.mockReturnValue(database);

    await expect(
      canManageAppointmentApi({ appointmentId, roles: ["THERAPIST"], userId }),
    ).resolves.toBe(true);
    expect(database.appointment.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        id: appointmentId,
        practitioner: { is: { userId } },
      },
    });
  });

  it("hides another practitioner's appointment from a therapist", async () => {
    const database = createDatabase(null);
    getDatabaseMock.mockReturnValue(database);

    await expect(
      canManageAppointmentApi({ appointmentId, roles: ["THERAPIST"], userId }),
    ).resolves.toBe(false);
  });
});
