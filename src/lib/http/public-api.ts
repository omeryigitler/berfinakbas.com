import { NextResponse } from "next/server";

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the configured byte limit.");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readBoundedJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > maxBytes) {
    throw new RequestBodyTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) return JSON.parse("");

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let body = "";
  let receivedBytes = 0;

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;

    receivedBytes += chunk.value.byteLength;
    if (receivedBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new RequestBodyTooLargeError();
    }
    body += decoder.decode(chunk.value, { stream: true });
  }

  body += decoder.decode();
  return JSON.parse(body);
}

export function isJsonContentType(value: string | null): boolean {
  return value?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

export function publicJsonResponse(
  correlationId: string,
  body: unknown,
  status: number,
): NextResponse {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      "X-Correlation-ID": correlationId,
    },
    status,
  });
}
