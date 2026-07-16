import type { Prisma } from "@/generated/prisma/client";

export const duplicateMatchReasons = [
  "EMAIL",
  "PHONE",
  "GUARDIAN_EMAIL",
  "GUARDIAN_PHONE",
] as const;

export type DuplicateMatchReason = (typeof duplicateMatchReasons)[number];

export type PotentialDuplicateClient = Readonly<{
  clientId: string;
  firstName: string;
  lastName: string;
  matchReasons: readonly DuplicateMatchReason[];
  targetGuardianId: string | null;
  type: "ADULT" | "CHILD";
}>;

type DuplicateReviewTransaction = Pick<Prisma.TransactionClient, "client">;

function matches(value: string | null, candidate: string | null): boolean {
  return value !== null && candidate !== null && value === candidate;
}

export async function findPotentialDuplicateClients(
  transaction: DuplicateReviewTransaction,
  sourceClientId: string,
  options: Readonly<{ candidateWhere?: Prisma.ClientWhereInput }> = {},
): Promise<readonly PotentialDuplicateClient[]> {
  const source = await transaction.client.findUnique({
    select: {
      emailNormalized: true,
      firstName: true,
      guardians: {
        select: {
          guardian: {
            select: {
              emailNormalized: true,
              phoneNormalized: true,
            },
          },
        },
      },
      id: true,
      lastName: true,
      phoneNormalized: true,
      type: true,
    },
    where: { id: sourceClientId },
  });
  if (!source) return Object.freeze([]);

  const sourceGuardianContacts = source.guardians.map(({ guardian }) => guardian);
  const sourceGuardianEmails = [
    ...new Set(
      sourceGuardianContacts
        .map((guardian) => guardian.emailNormalized)
        .filter((value): value is string => value !== null),
    ),
  ];
  const sourceGuardianPhones = [
    ...new Set(
      sourceGuardianContacts
        .map((guardian) => guardian.phoneNormalized)
        .filter((value): value is string => value !== null),
    ),
  ];

  const adultContactConditions: Prisma.ClientWhereInput[] = [
    ...(source.emailNormalized
      ? [{ emailNormalized: source.emailNormalized } satisfies Prisma.ClientWhereInput]
      : []),
    ...(source.phoneNormalized
      ? [{ phoneNormalized: source.phoneNormalized } satisfies Prisma.ClientWhereInput]
      : []),
  ];
  const guardianContactConditions: Prisma.GuardianWhereInput[] = [
    ...(sourceGuardianEmails.length > 0
      ? [{ emailNormalized: { in: sourceGuardianEmails } } satisfies Prisma.GuardianWhereInput]
      : []),
    ...(sourceGuardianPhones.length > 0
      ? [{ phoneNormalized: { in: sourceGuardianPhones } } satisfies Prisma.GuardianWhereInput]
      : []),
  ];

  if (
    (source.type === "ADULT" && adultContactConditions.length === 0) ||
    (source.type === "CHILD" && guardianContactConditions.length === 0)
  ) {
    return Object.freeze([]);
  }

  const candidates = await transaction.client.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      emailNormalized: true,
      firstName: true,
      guardians: {
        select: {
          guardian: {
            select: {
              emailNormalized: true,
              id: true,
              phoneNormalized: true,
            },
          },
        },
      },
      id: true,
      lastName: true,
      phoneNormalized: true,
      type: true,
    },
    take: 10,
    where: {
      ...(options.candidateWhere ? { AND: [options.candidateWhere] } : {}),
      id: { not: source.id },
      type: source.type,
      ...(source.type === "ADULT"
        ? { OR: adultContactConditions }
        : {
            firstName: { equals: source.firstName, mode: "insensitive" },
            guardians: {
              some: {
                guardian: { OR: guardianContactConditions },
              },
            },
            lastName: { equals: source.lastName, mode: "insensitive" },
          }),
    },
  });

  return Object.freeze(
    candidates.flatMap((candidate): PotentialDuplicateClient[] => {
      if (source.type === "ADULT") {
        const matchReasons: DuplicateMatchReason[] = [];
        if (matches(source.emailNormalized, candidate.emailNormalized)) {
          matchReasons.push("EMAIL");
        }
        if (matches(source.phoneNormalized, candidate.phoneNormalized)) {
          matchReasons.push("PHONE");
        }
        return matchReasons.length === 0
          ? []
          : [
              Object.freeze({
                clientId: candidate.id,
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                matchReasons: Object.freeze(matchReasons),
                targetGuardianId: null,
                type: candidate.type,
              }),
            ];
      }

      const matchingGuardian = candidate.guardians
        .map(({ guardian }) => guardian)
        .map((guardian) => {
          const matchReasons: DuplicateMatchReason[] = [];
          if (
            guardian.emailNormalized !== null &&
            sourceGuardianEmails.includes(guardian.emailNormalized)
          ) {
            matchReasons.push("GUARDIAN_EMAIL");
          }
          if (
            guardian.phoneNormalized !== null &&
            sourceGuardianPhones.includes(guardian.phoneNormalized)
          ) {
            matchReasons.push("GUARDIAN_PHONE");
          }
          return { guardian, matchReasons };
        })
        .find(({ matchReasons }) => matchReasons.length > 0);

      return matchingGuardian
        ? [
            Object.freeze({
              clientId: candidate.id,
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              matchReasons: Object.freeze(matchingGuardian.matchReasons),
              targetGuardianId: matchingGuardian.guardian.id,
              type: candidate.type,
            }),
          ]
        : [];
    }),
  );
}
