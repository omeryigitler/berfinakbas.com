"use client";

export async function loadFinanceData() {
  const path = ["", "api", "admin", "finance"].join("/");
  return fetch(`${path}?status=ALL`, { cache: "no-store" });
}
