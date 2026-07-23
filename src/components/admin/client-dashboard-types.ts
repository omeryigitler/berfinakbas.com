export interface ClientListItem {
  appointmentsCount: number;
  createdAt?: string;
  email: string | null;
  firstName: string;
  id: string;
  lastName: string;
  nextAppointment: {
    serviceNameSnapshot: string;
    startsAt: string;
    status: string;
  } | null;
  notesCount: number;
  phone: string | null;
  plansCount: number;
  preferredName: string | null;
  score: number;
  status: "PROSPECTIVE" | "ACTIVE" | "INACTIVE";
  type: "ADULT" | "CHILD";
  updatedAt: string;
}

export interface ClientDetail {
  appointments: Array<{
    durationMinutesSnapshot: number;
    endsAt: string;
    id: string;
    locationTypeSnapshot: string;
    practitioner: { displayName: string };
    publicReference: string;
    requestNote: string | null;
    serviceNameSnapshot: string;
    startsAt: string;
    status: string;
  }>;
  birthYear: number | null;
  createdAt: string;
  email: string | null;
  financeEntries: Array<{
    amountMinor: string;
    currency: string;
    externalReference: string | null;
    id: string;
    note: string | null;
    occurredAt: string;
    paymentMethod: { name: string } | null;
    plan: { name: string } | null;
    type: string;
  }>;
  firstName: string;
  guardians: Array<{
    guardian: {
      email: string | null;
      firstName: string;
      id: string;
      lastName: string;
      phone: string;
    };
    isPrimary: boolean;
    relationship: string;
  }>;
  id: string;
  lastName: string;
  nextAppointment: {
    durationMinutesSnapshot: number;
    endsAt: string;
    id: string;
    locationTypeSnapshot: string;
    practitioner: { displayName: string };
    publicReference: string;
    requestNote: string | null;
    serviceNameSnapshot: string;
    startsAt: string;
    status: string;
  } | null;
  notes: Array<{
    category: string;
    createdAt: string;
    createdBy: { name: string | null };
    id: string;
    note: string;
  }>;
  phone: string | null;
  financeSummary: {
    hasOpenBalance: boolean;
    openBalanceLabel: string;
    paidLabel: string;
    planTotalLabel: string;
    remainingSessions: number;
  };
  plans: Array<{
    balanceMinor: string;
    currency: string;
    id: string;
    name: string;
    remainingSessions: string;
    sessionCount: number;
    sessionDurationMinutes: number;
    status: string;
    totalAmountMinor: string;
    validFrom: string;
    validUntil: string | null;
  }>;
  preferredName: string | null;
  score: number;
  status: "PROSPECTIVE" | "ACTIVE" | "INACTIVE";
  type: "ADULT" | "CHILD";
  updatedAt: string;
}
