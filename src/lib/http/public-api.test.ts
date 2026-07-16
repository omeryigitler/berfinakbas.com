import { describe, expect, it } from "vitest";

import {
  isJsonContentType,
  publicJsonResponse,
  readBoundedJsonBody,
  RequestBodyTooLargeError,
} from "./public-api";

describe("readBoundedJsonBody", () => {
  it("parses JSON within the configured byte limit", async () => {
    const request = new Request("https://berfinakbas.com/api/public/test", {
      body: JSON.stringify({ value: "ok" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    await expect(readBoundedJsonBody(request, 64)).resolves.toEqual({ value: "ok" });
  });

  it("rejects a declared body larger than the configured byte limit", async () => {
    const request = new Request("https://berfinakbas.com/api/public/test", {
      body: "{}",
      headers: { "content-length": "65" },
      method: "POST",
    });

    await expect(readBoundedJsonBody(request, 64)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("rejects a streamed body that exceeds the configured byte limit", async () => {
    const request = new Request("https://berfinakbas.com/api/public/test", {
      body: JSON.stringify({ value: "too-long" }),
      method: "POST",
    });

    await expect(readBoundedJsonBody(request, 8)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://berfinakbas.com/api/public/test", {
      body: "{",
      method: "POST",
    });

    await expect(readBoundedJsonBody(request, 64)).rejects.toBeInstanceOf(SyntaxError);
  });
});

describe("isJsonContentType", () => {
  it("accepts JSON with optional parameters and rejects other or missing values", () => {
    expect(isJsonContentType("application/json")).toBe(true);
    expect(isJsonContentType("application/json; charset=utf-8")).toBe(true);
    expect(isJsonContentType("text/plain")).toBe(false);
    expect(isJsonContentType(null)).toBe(false);
  });
});

describe("publicJsonResponse", () => {
  it("returns the safe public response headers and status", async () => {
    const response = publicJsonResponse("request-123", { data: { ok: true } }, 201);

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-correlation-id")).toBe("request-123");
    await expect(response.json()).resolves.toEqual({ data: { ok: true } });
  });
});
