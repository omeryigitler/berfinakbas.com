import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasPermission } from "@/domain/auth/permissions";
import { matchesClientCreateReplay } from "@/domain/clients/client-create-idempotency";
import { createClientPayloadSchema } from "@/domain/clients/client-management";
import { isRetryableTransactionError } from "@/lib/booking/appointment-hold-service";
import { getDatabase } from "@/lib/db";
import { getServerEnvironment } from "@/lib/env";
import { getSafeCorrelationId, hasTrustedOrigin } from "@/lib/request-security";

const MAX_REQUEST_BODY_BYTES = 24 * 1_024;
const MAX_TRANSACTION_ATTEMPTS = 3;
const clientStatuses = ["PROSPECTIVE", "ACTIVE", "INACTIVE"] as const;

class RequestBodyTooLargeError extends Error {}
class GuardianNotFoundError extends Error {}
class ClientCreateConflictError extends Error {}

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

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function findStoredClient(clientId: string) {
  return getDatabase().client.findUnique({
    include: {
      guardians: {
        include: {
          guardian: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      },
    },
    where: { id: clientId },
  });
}

export async function GET(request: Request) {
  const session = await auth();
  if (
    !session?.user ||
    session.user.status !== "ACTIVE" ||
    !hasPermission(session.user.roles, "clients:read")
  ) {
    return forbidden();
  }

  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const rawTake = Number(params.get("take") ?? "100");
  const take = Number.isFinite(rawTake) ? Math.min(Math.max(Math.trunc(rawTake), 1), 100) : 100;
  const rawStatus = params.get("status");
  const status = clientStatuses.find((value) => value === rawStatus);
  const now = new Date();

  const clients = await getDatabase().client.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      _count: { select: { appointments: true, notes: true, plans: true } },
      appointments: {
        orderBy: { startsAt: "asc" },
        select: {
          serviceNameSnapshot: true,
          startsAt: true,
          status: true,
        },
        take: 1,
        where: {
          startsAt: { gte: now },
          status: { in: ["REQUESTED", "PENDING_REVIEW", "CONFIRMED", "RESCHEDULE_PROPOSED"] },
        },
      },
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      phone: true,
      preferredName: true,
      status: true,
      type: true,
      updatedAt: true,
    },
    take,
    where: {
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
            ],
          }
        : {}),
    },
  });

  return NextResponse.json(
    {
      data: clients.map((client) => {
        const nextAppointment = client.appointments[0] ?? null;
        const score = Math.min(
          100,
          35 +
            (client.phone ? 15 : 0) +
            (client.email ? 15 : 0) +
            Math.min(client._count.appointments * 5, 20) +
            Math.min(client._count.notes * 3, 15),
        );

        return {
          appointmentsCount: client._count.appointments,
          email: client.email,
          firstName: client.firstName,
          id: client.id,
          lastName: client.lastName,
          nextAppointment,
          notesCount: client._count.notes,
          phone: client.phone,
          plansCount: client._count.plans,
          preferredName: client.preferredName,
          score,
          status: client.status,
          type: client.type,
          updatedAt: client.updatedAt,
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
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
  const correlationId = getSafeCorrelationId(request.headers.get("x-correlation-id"));

  try {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      const existing = await findStoredClient(payload.requestId);
      if (existing) {
        if (!matchesClientCreateReplay(existing, payload)) {
          throw new ClientCreateConflictError();
        }
        return NextResponse.json({ data: { id: existing.id }, replayed: true }, { status: 200 });
      }

      try {
        const client = await database.$transaction(
          async (transaction) => {
            const createdClient = await transaction.client.create({
              data: {
                birthYear: payload.birthYear,
                email: payload.email,
                firstName: payload.firstName,
                id: payload.requestId,
                lastName: payload.lastName,
                phone: payload.phone,
                preferredName: payload.preferredName,
                status: payload.status,
                type: payload.type,
              },
              select: { id: true },
            });

            let guardianId: string | null = null;
            if (payload.type === "CHILD") {
              const relationship = payload.relationship;
              if (!relationship) throw new GuardianNotFoundError();

              if (payload.guardianMode === "EXISTING") {
                guardianId = payload.guardianId;
                if (!guardianId) throw new GuardianNotFoundError();
                const guardian = await transaction.guardian.findUnique({
                  select: { id: true },
                  where: { id: guardianId },
                });
                if (!guardian) throw new GuardianNotFoundError();
              } else if (payload.guardianMode === "NEW") {
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
                guardianId = guardian.id;
              }

              if (!guardianId) throw new GuardianNotFoundError();
              await transaction.clientGuardian.create({
                data: {
                  clientId: createdClient.id,
                  guardianId,
                  isPrimary: true,
                  relationship,
                },
              });
            }

            await transaction.auditLog.create({
              data: {
                action: "client.created",
                actorType: "USER",
                actorUserId: session.user.id,
                afterSummary: {
                  guardianLinked: guardianId !== null,
                  guardianMode: payload.type === "CHILD" ? payload.guardianMode : null,
                  status: payload.status,
                  type: payload.type,
                },
                correlationId,
                entityId: createdClient.id,
                entityType: "CLIENT",
                reason: "CLIENT_CREATED",
              },
            });

            return createdClient;
          },
          { isolationLevel: "Serializable" },
        );

        return NextResponse.json({ data: client, replayed: false }, { status: 201 });
      } catch (error) {
        if (isUniqueConflict(error) || isRetryableTransactionError(error)) {
          const replay = await findStoredClient(payload.requestId);
          if (replay) {
            if (!matchesClientCreateReplay(replay, payload)) {
              throw new ClientCreateConflictError();
            }
            return NextResponse.json({ data: { id: replay.id }, replayed: true }, { status: 200 });
          }
          if (attempt < MAX_TRANSACTION_ATTEMPTS) continue;
          throw new ClientCreateConflictError();
        }
        throw error;
      }
    }
    throw new ClientCreateConflictError();
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
    if (error instanceof ClientCreateConflictError) {
      return NextResponse.json(
        {
          code: "CLIENT_CREATE_CONFLICT",
          error: "Bu danışan oluşturma isteği farklı bilgilerle daha önce kullanılmış.",
        },
        { status: 409 },
      );
    }
    throw error;
  }
}