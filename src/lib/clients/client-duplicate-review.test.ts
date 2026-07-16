import { describe, expect, it, vi } from "vitest";

import { findPotentialDuplicateClients } from "./client-duplicate-review";

function transaction(source: unknown, candidates: unknown[] = []) {
  return {
    client: {
      findMany: vi.fn().mockResolvedValue(candidates),
      findUnique: vi.fn().mockResolvedValue(source),
    },
  };
}

describe("findPotentialDuplicateClients", () => {
  it("matches an adult only by exact normalized contact values", async () => {
    const database = transaction(
      {
        emailNormalized: "danisan@example.com",
        firstName: "Yeni",
        guardians: [],
        id: "source",
        lastName: "Danışan",
        phoneNormalized: "905551112233",
        type: "ADULT",
      },
      [
        {
          emailNormalized: "danisan@example.com",
          firstName: "Mevcut",
          guardians: [],
          id: "candidate",
          lastName: "Danışan",
          phoneNormalized: "905551112233",
          type: "ADULT",
        },
      ],
    );

    await expect(findPotentialDuplicateClients(database as never, "source")).resolves.toEqual([
      {
        clientId: "candidate",
        firstName: "Mevcut",
        lastName: "Danışan",
        matchReasons: ["EMAIL", "PHONE"],
        targetGuardianId: null,
        type: "ADULT",
      },
    ]);
  });

  it("requires both the child name and an exact guardian contact match", async () => {
    const database = transaction(
      {
        emailNormalized: null,
        firstName: "Çocuk",
        guardians: [
          {
            guardian: {
              emailNormalized: "veli@example.com",
              phoneNormalized: "905551112233",
            },
          },
        ],
        id: "source",
        lastName: "Danışan",
        phoneNormalized: null,
        type: "CHILD",
      },
      [
        {
          emailNormalized: null,
          firstName: "Çocuk",
          guardians: [
            {
              guardian: {
                emailNormalized: "veli@example.com",
                id: "guardian",
                phoneNormalized: "905559999999",
              },
            },
          ],
          id: "candidate",
          lastName: "Danışan",
          phoneNormalized: null,
          type: "CHILD",
        },
      ],
    );

    await expect(findPotentialDuplicateClients(database as never, "source")).resolves.toEqual([
      {
        clientId: "candidate",
        firstName: "Çocuk",
        lastName: "Danışan",
        matchReasons: ["GUARDIAN_EMAIL"],
        targetGuardianId: "guardian",
        type: "CHILD",
      },
    ]);
    expect(database.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        where: expect.objectContaining({
          firstName: { equals: "Çocuk", mode: "insensitive" },
          lastName: { equals: "Danışan", mode: "insensitive" },
          type: "CHILD",
        }),
      }),
    );
  });

  it("does not query candidates when there is no comparable contact", async () => {
    const database = transaction({
      emailNormalized: null,
      firstName: "Eksik",
      guardians: [],
      id: "source",
      lastName: "İletişim",
      phoneNormalized: null,
      type: "ADULT",
    });

    await expect(findPotentialDuplicateClients(database as never, "source")).resolves.toEqual([]);
    expect(database.client.findMany).not.toHaveBeenCalled();
  });
});
