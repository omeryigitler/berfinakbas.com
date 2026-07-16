import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkBotIdMock } = vi.hoisted(() => ({ checkBotIdMock: vi.fn() }));

vi.mock("botid/server", () => ({ checkBotId: checkBotIdMock }));

import { checkPublicBotProtection } from "./public-bot-protection";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkPublicBotProtection", () => {
  it.each([
    [false, "allowed"],
    [true, "blocked"],
  ] as const)("maps isBot=%s to %s", async (isBot, expected) => {
    checkBotIdMock.mockResolvedValue({ isBot });

    await expect(checkPublicBotProtection()).resolves.toBe(expected);
  });

  it("fails closed when BotID verification is unavailable", async () => {
    checkBotIdMock.mockRejectedValue(new Error("synthetic BotID failure"));

    await expect(checkPublicBotProtection()).resolves.toBe("unavailable");
  });
});
