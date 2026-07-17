import { describe, expect, it } from "vitest";

import {
  buildClientProfileFinanceSummary,
  buildClientProfileOperationStatus,
} from "./client-profile-summary";

describe("buildClientProfileFinanceSummary", () => {
  it("keeps TRY and EUR plan totals separate", () => {
    const summary = buildClientProfileFinanceSummary([
      {
        balanceMinor: "50000",
        currency: "TRY",
        remainingSessions: "3",
        status: "ACTIVE",
        totalAmountMinor: "200000",
      },
      {
        balanceMinor: "10000",
        currency: "EUR",
        remainingSessions: "2",
        status: "ACTIVE",
        totalAmountMinor: "50000",
      },
    ]);

    expect(summary.planTotalLabel).toContain("₺2.000,00");
    expect(summary.planTotalLabel).toContain("€500,00");
    expect(summary.planTotalLabel).toContain(" + ");
    expect(summary.openBalanceLabel).toContain("₺500,00");
    expect(summary.openBalanceLabel).toContain("€100,00");
    expect(summary.paidLabel).toContain("₺1.500,00");
    expect(summary.paidLabel).toContain("€400,00");
    expect(summary.remainingSessions).toBe(5);
    expect(summary.hasOpenBalance).toBe(true);
  });

  it("does not invent a default currency for an empty profile", () => {
    expect(buildClientProfileFinanceSummary([])).toEqual({
      hasOpenBalance: false,
      openBalanceLabel: "Kayıt yok",
      paidLabel: "Kayıt yok",
      planTotalLabel: "Kayıt yok",
      remainingSessions: 0,
    });
  });
});

describe("buildClientProfileOperationStatus", () => {
  it("prioritizes a missing guardian for a child client", () => {
    expect(
      buildClientProfileOperationStatus({
        canReadAppointments: false,
        canReadFinance: false,
        clientType: "CHILD",
        hasAppointment: false,
        hasGuardian: false,
        hasOpenBalance: false,
        openBalanceLabel: "Kayıt yok",
      }),
    ).toEqual({
      detail: "Çocuk danışan için veli bilgisi bağlanmalı.",
      title: "Veli eksik",
    });
  });

  it("does not claim that an appointment is missing when appointment permission is absent", () => {
    expect(
      buildClientProfileOperationStatus({
        canReadAppointments: false,
        canReadFinance: true,
        clientType: "ADULT",
        hasAppointment: false,
        hasGuardian: false,
        hasOpenBalance: false,
        openBalanceLabel: "Kayıt yok",
      }),
    ).toEqual({
      detail: "Özet yalnızca bu rolün erişebildiği kayıtları değerlendiriyor.",
      title: "Kısmi görünüm",
    });
  });

  it("shows open balance only when finance permission exists", () => {
    expect(
      buildClientProfileOperationStatus({
        canReadAppointments: true,
        canReadFinance: true,
        clientType: "ADULT",
        hasAppointment: true,
        hasGuardian: false,
        hasOpenBalance: true,
        openBalanceLabel: "₺500,00 + €100,00",
      }),
    ).toEqual({ detail: "₺500,00 + €100,00", title: "Açık bakiye var" });
  });
});
