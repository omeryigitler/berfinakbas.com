import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { createClientPayloadSchema } from "@/domain/clients/client-management";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { hasTrustedOrigin } from "@/lib/request-security";

const MAX_REQUEST_BODY_BYTES = 24 * 1_024;

class RequestBodyTooLargeError extends Error {}
class GuardianNotFoundError extends Error {}

async function readBoundedJsonBody(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > MAX_REQUEST_BODY_BYTES) {
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
    if (receivedBytes > MAX_REQUEST_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new RequestBodyTooLargeError();
    }
    body += decoder.decode(chunk.value, { stream: true });
  }
  body += decoder.decode();
  return JSON.parse(body);
}

function forbidden() {
  return NextResponse.json(
    { code: "FORBIDDEN", error: "Bu işlem için yetkiniz yok." },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "clients:manage")
  ) {
    return forbidden();
  }

  const environment = getServerEnvironment();
  if (!hasTrustedOrigin(request.headers.get("origin"), environment.APP_URL)) {
    return NextResponse.json(
      { code: "UNTRUSTED_ORIGIN", error: "Güvenilmeyen istek kaynağı." },
      { status: 403 },
    );
  }

  if (
    request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !==
    "application/json"
  ) {
    return NextResponse.json(
      { code: "UNSUPPORTED_MEDIA_TYPE", error: "İstek gövdesi JSON olmalıdır." },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await readBoundedJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { code: "BODY_TOO_LARGE", error: "İstek gövdesi izin verilen sınırı aşıyor." },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { code: "INVALID_JSON", error: "İstek gövdesi geçerli JSON olmalıdır." },
      { status: 400 },
    );
  }

  const parsed = createClientPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "INVALID_REQUEST",
        error: "Danışan alanlarını kontrol edin.",
        issues: parsed.error.issues.map((issue) => ({
          code: issue.code,
          message: issue.message,
          path: issue.path.join("."),
        })),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const database = getDatabase();

  try {
    const client = await database.$transaction(
      async (transaction) => {
        const createdClient = await transaction.client.create({
          data: {
            birthYear: payload.birthYear,
            email: payload.email,
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            preferredName: payload.preferredName,
            status: payload.status,
            type: payload.type,
          },
          select: { id: true },
        });

        if (payload.type === "CHILD") {
          const relationship = payload.relationship;
          if (!relationship) throw new GuardianNotFoundError();

          if (payload.guardianMode === "EXISTING") {
            const guardianId = payload.guardianId;
            if (!guardianId) throw new GuardianNotFoundError();
            const guardian = await transaction.guardian.findUnique({
              select: { id: true },
              where: { id: guardianId },
            });
            if (!guardian) throw new GuardianNotFoundError();

            await transaction.clientGuardian.create({
              data: {
                clientId: createdClient.id,
                guardianId: guardian.id,
                isPrimary: true,
                relationship,
              },
            });
          }

          if (payload.guardianMode === "NEW") {
            if (
              !payload.guardianFirstName ||
              !payload.guardianLastName ||
              !payload.guardianPhone
            ) {
              throw new GuardianNotFoundError();
            }
            const guardian = await transaction.guardian.create({
              data: {
                email: payload.guardianEmail,
                firstName: payload.guardianFirstName,
                lastName: payload.guardianLastName,
                phone: payload.guardianPhone,
              },
              select: { id: true },
            });

            await transaction.clientGuardian.create({
              data: {
                clientId: createdClient.id,
                guardianId: guardian.id,
                isPrimary: true,
                relationship,
              },
            });
          }
        }

        return createdClient;
      },
      { isolationLevel: "Serializable" },
    );

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    if (error instanceof GuardianNotFoundError) {
      return NextResponse.json(
        {
          code: "GUARDIAN_REQUIRED",
          error: "Çocuk danışan için geçerli bir veli kaydı zorunludur.",
        },
        { status: 422 },
      );
    }
    throw error;
  }
}
